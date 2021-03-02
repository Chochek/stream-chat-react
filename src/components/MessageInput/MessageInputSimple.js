// @ts-check
import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import { TranslationContext } from '../../context';
import { ChatAutoComplete } from '../ChatAutoComplete';
import { Tooltip } from '../Tooltip';
import useMessageInput from './hooks/messageInput';
import EmojiPicker from './EmojiPicker';
import DefaultSendButton, { EmojiIconLarge as DefaultEmojiIcon } from './icons';

/** @type {React.FC<import("types").MessageInputProps>} */
const MessageInputSimple = (props) => {
  const {
    EmojiIcon = DefaultEmojiIcon,
    SendButton = DefaultSendButton,
  } = props;

  const { t } = useContext(TranslationContext);

  const messageInput = useMessageInput(props);

  return (
    <div
      className={`str-chat__input-flat ${
        SendButton ? 'str-chat__input-flat--send-button-active' : null
      }`}
    >
      <div className="str-chat__input-flat-wrapper">
        <div className="str-chat__input-flat--textarea-wrapper">
          <ChatAutoComplete
            commands={messageInput.getCommands()}
            innerRef={messageInput.textareaRef}
            handleSubmit={messageInput.handleSubmit}
            onSelectItem={messageInput.onSelectItem}
            onChange={messageInput.handleChange}
            value={messageInput.text}
            rows={1}
            keycodeSubmitKeys={props.keycodeSubmitKeys}
            maxRows={props.maxRows}
            placeholder={t('Type your message')}
            onPaste={messageInput.onPaste}
            triggers={props.autocompleteTriggers}
            grow={props.grow}
            disabled={props.disabled}
            disableMentions={props.disableMentions}
            SuggestionList={props.SuggestionList}
            additionalTextareaProps={props.additionalTextareaProps}
          />

          <div className="str-chat__emojiselect-wrapper">
            <Tooltip>{t('Open emoji picker')}</Tooltip>
            <span
              className="str-chat__input-flat-emojiselect"
              onClick={messageInput.openEmojiPicker}
              onKeyDown={messageInput.handleEmojiKeyDown}
              role="button"
              tabIndex={0}
            >
              <EmojiIcon />
            </span>
          </div>
          <EmojiPicker {...messageInput} />
        </div>
        {SendButton && <SendButton sendMessage={messageInput.handleSubmit} />}
      </div>
    </div>
  );
};

MessageInputSimple.propTypes = {
  /** Set focus to the text input if this is enabled */
  focus: PropTypes.bool.isRequired,
  /** Grow the textarea while you're typing */
  grow: PropTypes.bool.isRequired,
  /** Optional Array of keycode values
   * Keycodes in this array will override Enter ([13]), which is the default submit key. Shift+Enter is the default for new line.
   * Options are Shift+Enter ([16, 13]), ctrl+Enter ([17, 13]), cmd+Enter ([91, 13] or [92, 13]).
   * If Shift+Enter is submitted, the default for new line is overridden.
   * */
  keycodeSubmitKeys: PropTypes.array,
  /** Specify the max amount of rows the textarea is able to grow */
  maxRows: PropTypes.number.isRequired,
  /** Make the textarea disabled */
  disabled: PropTypes.bool,
  /** Disable mentions in textarea */
  disableMentions: PropTypes.bool,
  /** enable/disable firing the typing event */
  publishTypingEvent: PropTypes.bool,
  /**
   * Any additional attributes that you may want to add for underlying HTML textarea element.
   */
  additionalTextareaProps: /** @type {PropTypes.Validator<React.TextareaHTMLAttributes<import('types').AnyType>>} */ (PropTypes.object),
  /**
   * Override the default triggers of the ChatAutoComplete component
   */
  autocompleteTriggers: PropTypes.object,
  /**
   * @param message: the Message object to be sent
   * @param cid: the channel id
   */
  overrideSubmitHandler: PropTypes.func,
  /** Override image upload request */
  doImageUploadRequest: PropTypes.func,
  /** Override file upload request */
  doFileUploadRequest: PropTypes.func,
  /**
   * Custom UI component for emoji button in input.
   *
   * Defaults to and accepts same props as: [EmojiIconLarge](https://github.com/GetStream/stream-chat-react/blob/master/src/components/MessageInput/icons.js)
   * */
  EmojiIcon: /** @type {PropTypes.Validator<React.FC>} */ (PropTypes.elementType),
  /**
   * Custom UI component for send button.
   *
   * Defaults to and accepts same props as: [SendButton](https://getstream.github.io/stream-chat-react/#sendbutton)
   * */
  SendButton: /** @type {PropTypes.Validator<React.FC<import('types').SendButtonProps>>} */ (PropTypes.elementType),
  /** Optional UI component prop to override the default List component that displays suggestions */
  SuggestionList: /** @type {PropTypes.Validator<React.ElementType<import('types').SuggestionListProps>>} */ (PropTypes.elementType),
};

MessageInputSimple.defaultProps = {
  focus: false,
  disabled: false,
  publishTypingEvent: true,
  grow: true,
  maxRows: 10,
  additionalTextareaProps: {},
};

export default MessageInputSimple;
