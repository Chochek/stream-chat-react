import React, { useContext, useMemo, useRef } from 'react';

import PropTypes from 'prop-types';

import {
  useActionHandler,
  useEditHandler,
  useMentionsUIHandler,
  useOpenThreadHandler,
  useReactionClick,
  useReactionHandler,
  useRetryHandler,
  useUserHandler,
  useUserRole,
} from './hooks';
import {
  PinIndicator as DefaultPinIndicator,
  DeliveredCheckIcon,
  ErrorIcon,
  ReactionIcon,
  ThreadIcon,
} from './icons';
import { MessageRepliesCountButton } from './MessageRepliesCountButton';
import { MessageTimestamp } from './MessageTimestamp';
import { areMessagePropsEqual, getReadByTooltipText } from './utils';

import { ChannelContext, TranslationContext } from '../../context';
import { isOnlyEmojis, renderText, smartRender } from '../../utils';
import { Attachment as DefaultAttachment } from '../Attachment';
import { Avatar as DefaultAvatar } from '../Avatar';
import { LoadingIndicator } from '../Loading';
import { MessageActions } from '../MessageActions';
import {
  EditMessageForm as DefaultEditMessageForm,
  MessageInput,
} from '../MessageInput';
import { MML } from '../MML';
import {
  ReactionSelector as DefaultReactionSelector,
  SimpleReactionsList as DefaultReactionsList,
} from '../Reactions';
import { Tooltip } from '../Tooltip';

/**
 * MessageTeam - Render component, should be used together with the Message component
 * Implements the look and feel for a team style collaboration environment
 *
 * @example ../../docs/MessageTeam.md
 * @typedef { import('types').MessageTeamProps } Props
 *
 * @type {React.FC<Props>}
 */
const MessageTeam = (props) => {
  const {
    message,
    threadList,
    formatDate,
    initialMessage,
    unsafeHTML,
    getMessageActions,
    Avatar = DefaultAvatar,
    EditMessageInput = DefaultEditMessageForm,
    MessageDeleted,
    PinIndicator = DefaultPinIndicator,
    ReactionsList = DefaultReactionsList,
    ReactionSelector = DefaultReactionSelector,
    editing: propEditing,
    setEditingState: propSetEdit,
    clearEditingState: propClearEdit,
    onMentionsHoverMessage: propOnMentionsHover,
    onMentionsClickMessage: propOnMentionsClick,
    channelConfig: propChannelConfig,
    handleAction: propHandleAction,
    handleOpenThread: propHandleOpenThread,
    handleReaction: propHandleReaction,
    handleRetry: propHandleRetry,
    updateMessage: propUpdateMessage,
    onUserClick: propOnUserClick,
    onUserHover: propOnUserHover,
    t: propT,
  } = props;

  /**
   *@type {import('types').ChannelContextValue}
   */
  const { channel, updateMessage: channelUpdateMessage } = useContext(
    ChannelContext,
  );
  const channelConfig = propChannelConfig || channel?.getConfig();
  const { t: contextT, userLanguage } = useContext(TranslationContext);
  const t = propT || contextT;
  const groupStyles = props.groupStyles || ['single'];
  const reactionSelectorRef = useRef(null);
  const messageWrapperRef = useRef(null);
  const {
    clearEdit: ownClearEditing,
    editing: ownEditing,
    setEdit: ownSetEditing,
  } = useEditHandler();
  const editing = propEditing || ownEditing;
  const setEdit = propSetEdit || ownSetEditing;
  const clearEdit = propClearEdit || ownClearEditing;
  const handleOpenThread = useOpenThreadHandler(message);
  const handleReaction = useReactionHandler(message);
  const handleAction = useActionHandler(message);
  const retryHandler = useRetryHandler();

  const retry = propHandleRetry || retryHandler;
  const { onMentionsClick, onMentionsHover } = useMentionsUIHandler(message, {
    onMentionsClick: propOnMentionsClick,
    onMentionsHover: propOnMentionsHover,
  });
  const {
    isReactionEnabled,
    onReactionListClick,
    showDetailedReactions,
  } = useReactionClick(message, reactionSelectorRef, messageWrapperRef);
  const { onUserClick, onUserHover } = useUserHandler(message, {
    onUserClickHandler: propOnUserClick,
    onUserHoverHandler: propOnUserHover,
  });
  const messageTextToRender =
    message?.i18n?.[`${userLanguage}_text`] || message?.text;
  const messageMentionedUsersItem = message?.mentioned_users;
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const messageText = useMemo(
    () => renderText(messageTextToRender, messageMentionedUsersItem),
    [messageMentionedUsersItem, messageTextToRender],
  );
  const firstGroupStyle = groupStyles ? groupStyles[0] : '';

  if (message?.type === 'message.read') {
    return null;
  }

  if (message?.deleted_at) {
    return smartRender(MessageDeleted, props, null);
  }

  if (editing) {
    return (
      <div
        className={`str-chat__message-team str-chat__message-team--${firstGroupStyle} str-chat__message-team--editing`}
        data-testid='message-team-edit'
      >
        {(firstGroupStyle === 'top' || firstGroupStyle === 'single') && (
          <div className='str-chat__message-team-meta'>
            <Avatar
              image={message?.user?.image}
              name={message?.user?.name || message?.user?.id}
              onClick={onUserClick}
              onMouseOver={onUserHover}
              size={40}
            />
          </div>
        )}
        <MessageInput
          clearEditingState={clearEdit}
          Input={EditMessageInput}
          message={message}
          updateMessage={propUpdateMessage || channelUpdateMessage}
        />
      </div>
    );
  }

  return (
    <React.Fragment>
      {message?.pinned && (
        <div className='str-chat__message-team-pin-indicator'>
          <PinIndicator message={message} t={t} />
        </div>
      )}
      <div
        className={`str-chat__message-team str-chat__message-team--${firstGroupStyle} str-chat__message-team--${
          message?.type
        } ${threadList ? 'thread-list' : ''} str-chat__message-team--${
          message?.status
        } ${message?.pinned ? 'pinned-message' : ''}`}
        data-testid='message-team'
        ref={messageWrapperRef}
      >
        <div className='str-chat__message-team-meta'>
          {firstGroupStyle === 'top' ||
          firstGroupStyle === 'single' ||
          initialMessage ? (
            <Avatar
              image={message?.user?.image}
              name={message?.user?.name || message?.user?.id}
              onClick={onUserClick}
              onMouseOver={onUserHover}
              size={40}
            />
          ) : (
            <div
              data-testid='team-meta-spacer'
              style={{ marginRight: 0, width: 40 }}
            />
          )}
          <MessageTimestamp
            formatDate={formatDate}
            message={message}
            tDateTimeParser={props.tDateTimeParser}
          />
        </div>
        <div className='str-chat__message-team-group'>
          {message &&
            (firstGroupStyle === 'top' ||
              firstGroupStyle === 'single' ||
              initialMessage) && (
              <div
                className='str-chat__message-team-author'
                data-testid='message-team-author'
                onClick={onUserClick}
              >
                <strong>{message.user?.name || message.user?.id}</strong>
                {message.type === 'error' && (
                  <div className='str-chat__message-team-error-header'>
                    {t('Only visible to you')}
                  </div>
                )}
              </div>
            )}
          <div
            className={`str-chat__message-team-content str-chat__message-team-content--${firstGroupStyle} str-chat__message-team-content--${
              message?.text === '' ? 'image' : 'text'
            }`}
            data-testid='message-team-content'
          >
            {!initialMessage &&
              message &&
              message.status !== 'sending' &&
              message.status !== 'failed' &&
              message.type !== 'system' &&
              message.type !== 'ephemeral' &&
              message.type !== 'error' && (
                <div
                  className={`str-chat__message-team-actions`}
                  data-testid='message-team-actions'
                >
                  {message && showDetailedReactions && (
                    <ReactionSelector
                      detailedView={true}
                      handleReaction={propHandleReaction || handleReaction}
                      latest_reactions={message.latest_reactions}
                      own_reactions={message.own_reactions}
                      reaction_counts={message.reaction_counts || undefined}
                      ref={reactionSelectorRef}
                    />
                  )}

                  {isReactionEnabled && (
                    <span
                      data-testid='message-team-reaction-icon'
                      onClick={onReactionListClick}
                      title='Reactions'
                    >
                      <ReactionIcon />
                    </span>
                  )}
                  {!threadList && channelConfig?.replies !== false && (
                    <span
                      data-testid='message-team-thread-icon'
                      onClick={propHandleOpenThread || handleOpenThread}
                      title='Start a thread'
                    >
                      <ThreadIcon />
                    </span>
                  )}
                  {message &&
                    getMessageActions &&
                    getMessageActions().length > 0 && (
                      <MessageActions
                        addNotification={props.addNotification}
                        customWrapperClass={''}
                        getFlagMessageErrorNotification={
                          props.getFlagMessageErrorNotification
                        }
                        getFlagMessageSuccessNotification={
                          props.getFlagMessageSuccessNotification
                        }
                        getMessageActions={props.getMessageActions}
                        getMuteUserErrorNotification={
                          props.getMuteUserErrorNotification
                        }
                        getMuteUserSuccessNotification={
                          props.getMuteUserSuccessNotification
                        }
                        handleDelete={props.handleDelete}
                        handleEdit={props.handleEdit}
                        handleFlag={props.handleFlag}
                        handleMute={props.handleMute}
                        handlePin={props.handlePin}
                        inline
                        message={message}
                        messageListRect={props.messageListRect}
                        messageWrapperRef={messageWrapperRef}
                        setEditingState={setEdit}
                      />
                    )}
                </div>
              )}
            {message && (
              <span
                className={
                  isOnlyEmojis(message.text)
                    ? 'str-chat__message-team-text--is-emoji'
                    : ''
                }
                data-testid='message-team-message'
                onClick={onMentionsClick}
                onMouseOver={onMentionsHover}
              >
                {unsafeHTML && message.html ? (
                  <div dangerouslySetInnerHTML={{ __html: message.html }} />
                ) : (
                  messageText
                )}
              </span>
            )}

            {message?.mml && (
              <MML
                actionHandler={handleAction}
                align='left'
                source={message.mml}
              />
            )}

            {message && message.text === '' && (
              <MessageTeamAttachments
                Attachment={props.Attachment}
                handleAction={propHandleAction || handleAction}
                message={message}
              />
            )}

            {message?.latest_reactions &&
              message.latest_reactions.length !== 0 &&
              message.text !== '' &&
              isReactionEnabled && (
                <ReactionsList
                  handleReaction={propHandleReaction || handleReaction}
                  own_reactions={message.own_reactions}
                  reaction_counts={message.reaction_counts || undefined}
                  reactions={message.latest_reactions}
                />
              )}
            {message?.status === 'failed' && (
              <button
                className='str-chat__message-team-failed'
                data-testid='message-team-failed'
                onClick={() => {
                  if (message.status === 'failed' && retry) {
                    // FIXME: type checking fails here because in the case of a failed message,
                    // `message` is of type Client.Message (i.e. request object)
                    // instead of Client.MessageResponse (i.e. server response object)
                    // @ts-expect-error
                    retry(message);
                  }
                }}
              >
                <ErrorIcon />
                {t('Message failed. Click to try again.')}
              </button>
            )}
          </div>
          <MessageTeamStatus
            Avatar={Avatar}
            lastReceivedId={props.lastReceivedId}
            message={message}
            readBy={props.readBy}
            t={propT}
            threadList={threadList}
          />
          {message && message.text !== '' && message.attachments && (
            <MessageTeamAttachments
              Attachment={props.Attachment}
              handleAction={propHandleAction || handleAction}
              message={message}
            />
          )}
          {message?.latest_reactions &&
            message.latest_reactions.length !== 0 &&
            message.text === '' &&
            isReactionEnabled && (
              <ReactionsList
                handleReaction={propHandleReaction || handleReaction}
                own_reactions={message.own_reactions}
                reaction_counts={message.reaction_counts || undefined}
                reactions={message.latest_reactions}
              />
            )}
          {!threadList && message && (
            <MessageRepliesCountButton
              onClick={propHandleOpenThread || handleOpenThread}
              reply_count={message.reply_count}
            />
          )}
        </div>
      </div>
    </React.Fragment>
  );
};

/** @type {(props: import('types').MessageTeamStatusProps) => React.ReactElement | null} */
const MessageTeamStatus = (props) => {
  const {
    Avatar = DefaultAvatar,
    readBy,
    message,
    threadList,
    lastReceivedId,
    t: propT,
  } = props;
  const { client } = useContext(ChannelContext);
  const { t: contextT } = useContext(TranslationContext);
  const t = propT || contextT;
  const { isMyMessage } = useUserRole(message);
  if (!isMyMessage || message?.type === 'error') {
    return null;
  }
  const justReadByMe =
    readBy &&
    client?.user &&
    readBy.length === 1 &&
    readBy[0] &&
    readBy[0].id === client.user.id;
  if (message && message.status === 'sending') {
    return (
      <span
        className='str-chat__message-team-status'
        data-testid='message-team-sending'
      >
        <Tooltip>{t && t('Sending...')}</Tooltip>
        <LoadingIndicator />
      </span>
    );
  }

  if (readBy && readBy.length !== 0 && !threadList && !justReadByMe) {
    const lastReadUser = readBy.filter(
      (item) => item && client?.user && item.id !== client.user.id,
    )[0];
    return (
      <span className='str-chat__message-team-status'>
        <Tooltip>{getReadByTooltipText(readBy, t, client)}</Tooltip>
        <Avatar
          image={lastReadUser?.image}
          name={lastReadUser?.name}
          size={15}
        />
        {readBy.length - 1 > 1 && (
          <span
            className='str-chat__message-team-status-number'
            data-testid='message-team-read-by-count'
          >
            {readBy.length - 1}
          </span>
        )}
      </span>
    );
  }

  if (
    message &&
    message.status === 'received' &&
    message.id === lastReceivedId &&
    !threadList
  ) {
    return (
      <span
        className='str-chat__message-team-status'
        data-testid='message-team-received'
      >
        <Tooltip>{t && t('Delivered')}</Tooltip>
        <DeliveredCheckIcon />
      </span>
    );
  }

  return null;
};

/** @type {(props: import('types').MessageTeamAttachmentsProps) => React.ReactElement | null} Typescript syntax */
const MessageTeamAttachments = (props) => {
  const { Attachment = DefaultAttachment, message, handleAction } = props;

  if (message?.attachments && Attachment) {
    return (
      <Attachment
        actionHandler={handleAction}
        attachments={message.attachments}
      />
    );
  }
  return null;
};

MessageTeam.propTypes = {
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
  /** Function to exit edit state */
  clearEditingState: PropTypes.func,
  /** Client object */
  client: /** @type {PropTypes.Validator<import('stream-chat').StreamChat>} */ (PropTypes.object),
  /** If the message is in edit state */
  editing: PropTypes.bool,
  /**
   * Custom UI component to override default edit message input
   *
   * Defaults to and accepts same props as: [EditMessageForm](https://github.com/GetStream/stream-chat-react/blob/master/src/components/MessageInput/EditMessageForm.js)
   * */
  EditMessageInput: /** @type {PropTypes.Validator<React.FC<import("types").MessageInputProps>>} */ (PropTypes.elementType),
  /** Override the default formatting of the date. This is a function that has access to the original date object. Returns a string or Node  */
  formatDate: PropTypes.func,
  /**
   * Returns all allowed actions on message by current user e.g., ['edit', 'delete', 'flag', 'mute', 'react', 'reply']
   * Please check [Message](https://github.com/GetStream/stream-chat-react/blob/master/src/components/Message.js) component for default implementation.
   * */
  getMessageActions: /** @type {PropTypes.Validator<() => Array<string>>} */ (PropTypes.func),
  /** Position of message in group. Possible values: top, bottom, middle, single */
  groupStyles: PropTypes.array,
  /**
   * @param name {string} Name of action
   * @param value {string} Value of action
   * @param event Dom event that triggered this handler
   */
  handleAction: PropTypes.func,
  /** Function to open thread on current message */
  handleOpenThread: PropTypes.func,
  /**
   * Handler for pinning a current message
   *
   * @param event React's MouseEventHandler event
   * @returns void
   * */
  handlePin: PropTypes.func,
  /**
   * Add or remove reaction on message
   *
   * @param type Type of reaction - 'like' | 'love' | 'haha' | 'wow' | 'sad' | 'angry'
   * @param event Dom event which triggered this function
   */
  handleReaction: PropTypes.func,
  /**
   * Reattempt sending a message
   * @param message A [message object](https://getstream.io/chat/docs/#message_format) to resent.
   */
  handleRetry: PropTypes.func,
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
   * */
  Message: /** @type {PropTypes.Validator<React.ElementType<import('types').MessageUIComponentProps>>} */ (PropTypes.oneOfType(
    [PropTypes.node, PropTypes.func, PropTypes.object],
  )),
  /**
   * The component that will be rendered if the message has been deleted.
   * All of Message's props are passed into this component.
   */
  MessageDeleted: /** @type {PropTypes.Validator<React.ElementType<import('types').MessageDeletedProps>>} */ (PropTypes.elementType),
  /** DOMRect object for parent MessageList component */
  messageListRect: /** @type {PropTypes.Validator<DOMRect>} */ (PropTypes.object),
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
   */
  onUserClick: PropTypes.func,
  /**
   * The handler for mouseOver event on the user that posted the message
   *
   * @param event Dom mouseOver event which triggered handler.
   */
  onUserHover: PropTypes.func,
  /**
   * Custom UI component to override default pinned message indicator
   *
   * Defaults to and accepts same props as: [PinIndicator](https://github.com/GetStream/stream-chat-react/blob/master/src/components/Message/icon.js)
   * */
  PinIndicator: /** @type {PropTypes.Validator<React.FC<import("types").PinIndicatorProps>>} */ (PropTypes.elementType),
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
  /**
   * Function to publish updates on message to channel
   *
   * @param message Updated [message object](https://getstream.io/chat/docs/#message_format)
   * */
  updateMessage: PropTypes.func,
};

export default React.memo(MessageTeam, areMessagePropsEqual);
