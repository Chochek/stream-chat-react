import React, { useRef } from 'react';

import PropTypes from 'prop-types';

import {
  useActionHandler,
  useOpenThreadHandler,
  useReactionClick,
  useReactionHandler,
  useUserHandler,
  useUserRole,
} from './hooks';
import { MessageOptions } from './MessageOptions';
import { MessageRepliesCountButton } from './MessageRepliesCountButton';
import { MessageText } from './MessageText';
import { MessageTimestamp } from './MessageTimestamp';
import {
  areMessagePropsEqual,
  messageHasAttachments,
  messageHasReactions,
} from './utils';

import { smartRender } from '../../utils';
import { Attachment as DefaultAttachment } from '../Attachment';
import { Avatar as DefaultAvatar } from '../Avatar';
import { MML } from '../MML';
import {
  ReactionSelector as DefaultReactionSelector,
  ReactionsList as DefaultReactionsList,
} from '../Reactions';

/**
 * MessageCommerce - Render component, should be used together with the Message component
 *
 * @example ../../docs/MessageCommerce.md
 * @type { React.FC<import('types').MessageCommerceProps> }
 */
const MessageCommerce = (props) => {
  const {
    message,
    formatDate,
    groupStyles,
    actionsEnabled,
    threadList,
    MessageDeleted,
    getMessageActions,
    ReactionsList = DefaultReactionsList,
    ReactionSelector = DefaultReactionSelector,
    handleReaction: propHandleReaction,
    handleAction: propHandleAction,
    handleOpenThread: propHandleOpenThread,
    onUserClick: propOnUserClick,
    onUserHover: propOnUserHover,
    tDateTimeParser: propTDateTimeParser,
  } = props;
  const Attachment = props.Attachment || DefaultAttachment;
  const Avatar = props.Avatar || DefaultAvatar;
  const hasReactions = messageHasReactions(message);
  const handleAction = useActionHandler(message);
  const handleReaction = useReactionHandler(message);
  const handleOpenThread = useOpenThreadHandler(message);
  const reactionSelectorRef = useRef(null);
  const {
    isReactionEnabled,
    onReactionListClick,
    showDetailedReactions,
  } = useReactionClick(message, reactionSelectorRef);
  const { onUserClick, onUserHover } = useUserHandler(message, {
    onUserClickHandler: propOnUserClick,
    onUserHoverHandler: propOnUserHover,
  });
  const { isMyMessage } = useUserRole(message);
  const messageClasses = `str-chat__message-commerce str-chat__message-commerce--${
    isMyMessage ? 'right' : 'left'
  }`;

  const hasAttachment = messageHasAttachments(message);

  const firstGroupStyle = groupStyles ? groupStyles[0] : '';

  if (message?.deleted_at) {
    return smartRender(MessageDeleted, props, null);
  }

  if (
    message &&
    (message.type === 'message.read' || message.type === 'message.date')
  ) {
    return null;
  }

  return (
    <React.Fragment>
      <div
        className={`
						${messageClasses}
						str-chat__message-commerce--${message?.type}
						${
              message?.text
                ? 'str-chat__message-commerce--has-text'
                : 'str-chat__message-commerce--has-no-text'
            }
						${hasAttachment ? 'str-chat__message-commerce--has-attachment' : ''}
						${
              hasReactions && isReactionEnabled
                ? 'str-chat__message-commerce--with-reactions'
                : ''
            }
            ${`str-chat__message-commerce--${firstGroupStyle}`}
            ${message?.pinned ? 'pinned-message' : ''}
					`.trim()}
        data-testid='message-commerce-wrapper'
        key={message?.id || ''}
      >
        {(firstGroupStyle === 'bottom' || firstGroupStyle === 'single') && (
          <Avatar
            image={message?.user?.image}
            name={message?.user?.name || message?.user?.id}
            onClick={onUserClick}
            onMouseOver={onUserHover}
            size={32}
          />
        )}
        <div className='str-chat__message-commerce-inner'>
          {message && !message.text && (
            <React.Fragment>
              {
                <MessageOptions
                  {...props}
                  displayActions={false}
                  displayLeft={false}
                  displayReplies={false}
                  onReactionListClick={onReactionListClick}
                  theme={'commerce'}
                />
              }
              {/* if reactions show them */}
              {hasReactions && !showDetailedReactions && isReactionEnabled && (
                <ReactionsList
                  onClick={onReactionListClick}
                  own_reactions={message.own_reactions}
                  reaction_counts={message.reaction_counts || undefined}
                  reactions={message.latest_reactions}
                />
              )}
              {showDetailedReactions && isReactionEnabled && (
                <ReactionSelector
                  detailedView
                  handleReaction={propHandleReaction || handleReaction}
                  latest_reactions={message.latest_reactions}
                  own_reactions={message.own_reactions}
                  reaction_counts={message.reaction_counts || undefined}
                  ref={reactionSelectorRef}
                  reverse={false}
                />
              )}
            </React.Fragment>
          )}

          {message?.attachments && Attachment && (
            <Attachment
              actionHandler={propHandleAction || handleAction}
              attachments={message.attachments}
            />
          )}

          {message?.mml && (
            <MML
              actionHandler={handleAction}
              align={isMyMessage ? 'right' : 'left'}
              source={message.mml}
            />
          )}

          {message?.text && (
            <MessageText
              actionsEnabled={actionsEnabled}
              customInnerClass='str-chat__message-commerce-text-inner'
              customOptionProps={{
                displayActions: false,
                displayLeft: false,
                displayReplies: false,
                theme: 'commerce',
              }}
              customWrapperClass='str-chat__message-commerce-text'
              getMessageActions={getMessageActions}
              message={message}
              messageListRect={props.messageListRect}
              onMentionsClickMessage={props.onMentionsClickMessage}
              onMentionsHoverMessage={props.onMentionsHoverMessage}
              ReactionSelector={ReactionSelector}
              ReactionsList={ReactionsList}
              theme='commerce'
              unsafeHTML={props.unsafeHTML}
            />
          )}
          {!threadList && (
            <div className='str-chat__message-commerce-reply-button'>
              <MessageRepliesCountButton
                onClick={propHandleOpenThread || handleOpenThread}
                reply_count={message?.reply_count}
              />
            </div>
          )}
          <div className='str-chat__message-commerce-data'>
            {!isMyMessage ? (
              <span className='str-chat__message-commerce-name'>
                {message?.user?.name || message?.user?.id}
              </span>
            ) : null}
            <MessageTimestamp
              customClass='str-chat__message-commerce-timestamp'
              format='LT'
              formatDate={formatDate}
              message={message}
              tDateTimeParser={propTDateTimeParser}
            />
          </div>
        </div>
      </div>
    </React.Fragment>
  );
};

MessageCommerce.propTypes = {
  /** If actions such as edit, delete, flag, mute are enabled on message */
  actionsEnabled: PropTypes.bool,
  /**
   * The attachment UI component.
   * Default: [Attachment](https://github.com/GetStream/stream-chat-react/blob/master/src/components/Attachment.js)
   * */
  Attachment: /** @type {PropTypes.Validator<React.ElementType<import('types').WrapperAttachmentUIComponentProps>>} */ (PropTypes.elementType),
  /**
   * Custom UI component to display user avatar
   *
   * Defaults to and accepts same props as: [Avatar](https://github.com/GetStream/stream-chat-react/blob/master/src/components/Avatar/Avatar.js)
   * */
  Avatar: /** @type {PropTypes.Validator<React.ElementType<import('types').AvatarProps>>} */ (PropTypes.elementType),
  /** Channel config object */
  channelConfig: /** @type {PropTypes.Validator<import('stream-chat').ChannelConfig>} */ (PropTypes.object),
  /** Override the default formatting of the date. This is a function that has access to the original date object. Returns a string or Node  */
  formatDate: PropTypes.func,
  /** Returns all allowed actions on message by current user e.g., ['edit', 'delete', 'flag', 'mute', 'react', 'reply'] */
  getMessageActions: PropTypes.func.isRequired,
  /** Position of message in group. Possible values: top, bottom, middle, single */
  groupStyles: PropTypes.array,
  /**
   * @param name {string} Name of action
   * @param value {string} Value of action
   * @param event Dom event that triggered this handler
   * @deprecated This component now relies on the useActionHandler custom hook, and this prop will be removed on the next major release.
   */
  handleAction: PropTypes.func,
  /**
   * Function to open thread on current message
   * @deprecated The component now relies on the useThreadHandler custom hook
   * You can customize the behaviour for your thread handler on the <Channel> component instead.
   */
  handleOpenThread: PropTypes.func,
  /**
   * Add or remove reaction on message
   *
   * @param type Type of reaction - 'like' | 'love' | 'haha' | 'wow' | 'sad' | 'angry'
   * @param event Dom event which triggered this function
   * @deprecated This component now relies on the useReactionHandler custom hook.
   */
  handleReaction: PropTypes.func,
  /** If its parent message in thread. */
  initialMessage: PropTypes.bool,
  /** Returns true if message belongs to current user */
  isMyMessage: PropTypes.func,
  /** The [message object](https://getstream.io/chat/docs/#message_format) */
  message: /** @type {PropTypes.Validator<import('stream-chat').MessageResponse>} */ (PropTypes
    .object.isRequired),
  /**
   *
   * @deprecated Its not recommended to use this anymore. All the methods in this HOC are provided explicitly.
   *
   * The higher order message component, most logic is delegated to this component
   * @see See [Message HOC](https://getstream.github.io/stream-chat-react/#message) for example
   *
   */
  Message: /** @type {PropTypes.Validator<React.ElementType<import('types').MessageUIComponentProps>>} */ (PropTypes.oneOfType(
    [PropTypes.node, PropTypes.func, PropTypes.object],
  )),
  /** The component that will be rendered if the message has been deleted.
   * All of Message's props are passed into this component.
   */
  MessageDeleted: /** @type {PropTypes.Validator<React.ElementType<import('types').MessageDeletedProps>>} */ (PropTypes.elementType),
  /**
   * The handler for click event on @mention in message
   *
   * @param event Dom click event which triggered handler.
   * @param user Target user object
   */
  onMentionsClickMessage: PropTypes.func,
  /**
   * The handler for hover event on @mention in message
   *
   * @param event Dom hover event which triggered handler.
   * @param user Target user object
   */
  onMentionsHoverMessage: PropTypes.func,
  /**
   * The handler for click event on the user that posted the message
   *
   * @param event Dom click event which triggered handler.
   * @deprecated This component now relies on the useUserHandler custom hook, and this prop will be removed on the next major release.
   */
  onUserClick: PropTypes.func,
  /**
   * The handler for mouseOver event on the user that posted the message
   *
   * @param event Dom mouseOver event which triggered handler.
   * @deprecated This component now relies on the useUserHandler custom hook, and this prop will be removed on the next major release.
   */
  onUserHover: PropTypes.func,
  /**
   * A component to display the selector that allows a user to react to a certain message.
   */
  ReactionSelector: /** @type {PropTypes.Validator<React.ElementType<import('types').ReactionSelectorProps>>} */ (PropTypes.elementType),
  /**
   * A component to display the a message list of reactions.
   */
  ReactionsList: /** @type {PropTypes.Validator<React.ElementType<import('types').ReactionsListProps>>} */ (PropTypes.elementType),
  /** If component is in thread list */
  threadList: PropTypes.bool,
  /** render HTML instead of markdown. Posting HTML is only allowed server-side */
  unsafeHTML: PropTypes.bool,
};

export default React.memo(MessageCommerce, areMessagePropsEqual);
