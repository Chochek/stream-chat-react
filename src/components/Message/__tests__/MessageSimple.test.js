import React from 'react';

import { act, cleanup, fireEvent, render } from '@testing-library/react';

import '@testing-library/jest-dom';
import Dayjs from 'dayjs';
import calendar from 'dayjs/plugin/calendar';

import {
  emojiMockConfig,
  generateChannel,
  generateMessage,
  generateReaction,
  generateUser,
  getTestClientWithUser,
} from 'mock-builders';

import { ChannelContext, TranslationContext } from '../../../context';
import { Avatar as AvatarMock } from '../../Avatar';
import {
  EditMessageForm,
  MessageInput as MessageInputMock,
} from '../../MessageInput';
import { MML as MMLMock } from '../../MML';
import { Modal as ModalMock } from '../../Modal';
import { MessageOptions as MessageOptionsMock } from '../MessageOptions';
import { MessageSimple } from '../MessageSimple';
import { MessageText as MessageTextMock } from '../MessageText';
import { MESSAGE_ACTIONS } from '../utils';

Dayjs.extend(calendar);

jest.mock('../MessageOptions', () => ({
  MessageOptions: jest.fn(() => <div />),
}));

jest.mock('../MessageText', () => ({ MessageText: jest.fn(() => <div />) }));
jest.mock('../../MML', () => ({ MML: jest.fn(() => <div />) }));
jest.mock('../../Avatar', () => ({ Avatar: jest.fn(() => <div />) }));

jest.mock('../../MessageInput', () => ({
  EditMessageForm: jest.fn(() => <div />),
  MessageInput: jest.fn(() => <div />),
}));

jest.mock('../../Modal', () => ({
  Modal: jest.fn((props) => <div>{props.children}</div>),
}));

const alice = generateUser();
const bob = generateUser({ image: 'bob-avatar.jpg', name: 'bob' });
const carol = generateUser();
const openThreadMock = jest.fn();
const tDateTimeParserMock = jest.fn((date) => Dayjs(date));
const retrySendMessageMock = jest.fn();

async function renderMessageSimple(
  message,
  props = {},
  channelConfig = { reactions: true, replies: true },
) {
  const channel = generateChannel({ getConfig: () => channelConfig });
  const client = await getTestClientWithUser(alice);
  return render(
    <ChannelContext.Provider
      value={{
        channel,
        client,
        emojiConfig: emojiMockConfig,
        openThread: openThreadMock,
        retrySendMessage: retrySendMessageMock,
      }}
    >
      <TranslationContext.Provider
        value={{ t: (key) => key, tDateTimeParser: tDateTimeParserMock }}
      >
        <MessageSimple
          getMessageActions={() => Object.keys(MESSAGE_ACTIONS)}
          message={message}
          threadList={false}
          typing={false}
          {...props}
        />
      </TranslationContext.Provider>
    </ChannelContext.Provider>,
  );
}

function generateAliceMessage(messageOptions) {
  return generateMessage({
    user: alice,
    ...messageOptions,
  });
}

function generateBobMessage(messageOptions) {
  return generateMessage({
    user: bob,
    ...messageOptions,
  });
}

const reactionSelectorTestId = 'reaction-selector';

describe('<MessageSimple />', () => {
  afterEach(cleanup);
  beforeEach(jest.clearAllMocks);

  it('should not render anything if message is of type message.read', async () => {
    const message = generateAliceMessage({ type: 'message.read' });
    const { container } = await renderMessageSimple(message);
    expect(container).toBeEmptyDOMElement();
  });

  it('should not render anything if message is of type message.date', async () => {
    const message = generateAliceMessage({ type: 'message.date' });
    const { container } = await renderMessageSimple(message);
    expect(container).toBeEmptyDOMElement();
  });

  it('should render deleted message with default MessageDelete component when message was deleted', async () => {
    const deletedMessage = generateAliceMessage({
      deleted_at: new Date('2019-12-17T03:24:00'),
    });
    const { getByTestId } = await renderMessageSimple(deletedMessage);
    expect(getByTestId('message-deleted-component')).toBeInTheDocument();
  });

  it('should render deleted message with custom component when message was deleted and a custom delete message component was passed', async () => {
    const deletedMessage = generateAliceMessage({
      deleted_at: new Date('2019-12-25T03:24:00'),
    });
    const CustomMessageDeletedComponent = () => (
      <p data-testid='custom-message-deleted'>Gone!</p>
    );
    const { getByTestId } = await renderMessageSimple(deletedMessage, {
      MessageDeleted: CustomMessageDeletedComponent,
    });
    expect(getByTestId('custom-message-deleted')).toBeInTheDocument();
  });

  it('should render custom edit message input component when one is given', async () => {
    const message = generateAliceMessage();
    const updateMessage = jest.fn();
    const clearEditingState = jest.fn();

    const CustomEditMessageInput = () => <div>Edit Input</div>;

    await renderMessageSimple(message, {
      clearEditingState,
      editing: true,
      EditMessageInput: CustomEditMessageInput,
      updateMessage,
    });

    expect(MessageInputMock).toHaveBeenCalledWith(
      expect.objectContaining({
        clearEditingState,
        Input: CustomEditMessageInput,
        message,
        updateMessage,
      }),
      {},
    );
  });

  it('should render reaction selector with custom component when one is given', async () => {
    const message = generateBobMessage({ text: undefined });
    // Passing the ref prevents a react warning
    // eslint-disable-next-line no-unused-vars
    const CustomReactionSelector = ({ handleReaction }, ref) => (
      <ul data-testid='custom-reaction-selector'>
        <li>
          <button onClick={(e) => handleReaction('smile-emoticon', e)}>
            :)
          </button>
        </li>
        <li>
          <button onClick={(e) => handleReaction('sad-emoticon', e)}>:(</button>
        </li>
      </ul>
    );
    const { getByTestId } = await renderMessageSimple(message, {
      ReactionSelector: React.forwardRef(CustomReactionSelector),
    });
    const { onReactionListClick } = MessageOptionsMock.mock.calls[0][0];
    act(() => onReactionListClick());
    expect(getByTestId('custom-reaction-selector')).toBeInTheDocument();
  });

  it('should not render reaction list if reaction is disbaled in channel config', async () => {
    const bobReaction = generateReaction({ user: bob });
    const message = generateAliceMessage({
      latest_reactions: [bobReaction],
      text: undefined,
    });

    const { queryByTestId } = await renderMessageSimple(
      message,
      {},
      { reactions: false },
    );
    expect(queryByTestId('reaction-list')).toBeNull();
  });

  it('should render reaction list with custom component when one is given', async () => {
    const bobReaction = generateReaction({ type: 'cool-reaction', user: bob });
    const message = generateAliceMessage({
      latest_reactions: [bobReaction],
      text: undefined,
    });
    const CustomReactionsList = ({ reactions }) => (
      <ul data-testid='custom-reaction-list'>
        {reactions.map((reaction) => {
          if (reaction.type === 'cool-reaction') {
            return <li key={reaction.type + reaction.user_id}>:)</li>;
          }
          return <li key={reaction.type + reaction.user_id}>?</li>;
        })}
      </ul>
    );
    const { getByTestId } = await renderMessageSimple(message, {
      ReactionsList: CustomReactionsList,
    });
    expect(getByTestId('custom-reaction-list')).toBeInTheDocument();
  });

  it('should render an edit form in a modal when in edit mode', async () => {
    const message = generateAliceMessage();
    const clearEditingState = jest.fn();
    const updateMessage = jest.fn();
    await renderMessageSimple(message, {
      clearEditingState,
      editing: true,
      updateMessage,
    });
    expect(ModalMock).toHaveBeenCalledWith(
      expect.objectContaining({
        onClose: clearEditingState,
        open: true,
      }),
      {},
    );
    expect(MessageInputMock).toHaveBeenCalledWith(
      expect.objectContaining({
        clearEditingState,
        Input: EditMessageForm,
        message,
        updateMessage,
      }),
      {},
    );
  });

  it('should render no status when message not from the current user', async () => {
    const message = generateAliceMessage();
    const { queryByTestId } = await renderMessageSimple(message);
    expect(queryByTestId(/message-status/)).toBeNull();
  });

  it('should not render status when message is an error message', async () => {
    const message = generateAliceMessage({ type: 'error' });
    const { queryByTestId } = await renderMessageSimple(message);
    expect(queryByTestId(/message-status/)).toBeNull();
  });

  it('should render sending status when sending message', async () => {
    const message = generateAliceMessage({ status: 'sending' });
    const { getByTestId } = await renderMessageSimple(message);
    expect(getByTestId('message-status-sending')).toBeInTheDocument();
  });

  it('should render the "read by" status when the message is not part of a thread and was read by another chat members', async () => {
    const message = generateAliceMessage();
    const { getByTestId } = await renderMessageSimple(message, {
      readBy: [alice, bob],
    });
    expect(getByTestId('message-status-read-by')).toBeInTheDocument();
  });

  it('should render the "read by many" status when the message is not part of a thread and was read by more than one other chat members', async () => {
    const message = generateAliceMessage();
    const { getByTestId } = await renderMessageSimple(message, {
      readBy: [alice, bob, carol],
    });
    expect(getByTestId('message-status-read-by-many')).toBeInTheDocument();
  });

  it('should render a received status when the message has a received status and it is the same message as the last received one', async () => {
    const message = generateAliceMessage({ status: 'received' });
    const { getByTestId } = await renderMessageSimple(message, {
      lastReceivedId: message.id,
    });
    expect(getByTestId('message-status-received')).toBeInTheDocument();
  });

  it('should not render status when rendered in a thread list and was read by other members', async () => {
    const message = generateAliceMessage();
    const { queryByTestId } = await renderMessageSimple(message, {
      readBy: [alice, bob, carol],
      threadList: true,
    });
    expect(queryByTestId(/message-status/)).toBeNull();
  });

  it("should render the message user's avatar", async () => {
    const message = generateBobMessage();
    await renderMessageSimple(message, {
      onUserClick: jest.fn(),
      onUserHover: jest.fn(),
    });
    expect(AvatarMock).toHaveBeenCalledWith(
      {
        image: message.user.image,
        name: message.user.name,
        onClick: expect.any(Function),
        onMouseOver: expect.any(Function),
      },
      {},
    );
  });

  it('should allow message to be retried when it failed', async () => {
    const message = generateAliceMessage({ status: 'failed' });
    const { getByTestId } = await renderMessageSimple(message);
    expect(retrySendMessageMock).not.toHaveBeenCalled();
    fireEvent.click(getByTestId('message-inner'));
    expect(retrySendMessageMock).toHaveBeenCalledWith(message);
  });

  it('should render message options', async () => {
    const message = generateAliceMessage({ text: undefined });
    await renderMessageSimple(message, {
      handleOpenThread: jest.fn(),
    });
    expect(MessageOptionsMock).toHaveBeenCalledWith(
      expect.objectContaining({
        handleOpenThread: expect.any(Function),
        message,
        messageWrapperRef: expect.any(Object),
        onReactionListClick: expect.any(Function),
        threadList: false,
      }),
      {},
    );
  });

  it('should render MML', async () => {
    const mml = '<mml>text</mml>';
    const message = generateAliceMessage({ mml });
    await renderMessageSimple(message);
    expect(MMLMock).toHaveBeenCalledWith(
      expect.objectContaining({ align: 'right', source: mml }),
      {},
    );
  });

  it('should render MML on left for others', async () => {
    const mml = '<mml>text</mml>';
    const message = generateBobMessage({ mml });
    await renderMessageSimple(message);
    expect(MMLMock).toHaveBeenCalledWith(
      expect.objectContaining({ align: 'left', source: mml }),
      {},
    );
  });

  it('should render message text when message has text', async () => {
    const message = generateAliceMessage({ text: 'Hello' });
    const actionsEnabled = true;
    const messageListRect = {
      bottom: 100,
      height: 100,
      left: 0,
      right: 100,
      toJSON: () => {},
      top: 0,
      width: 100,
      x: 0,
      y: 0,
    };
    const unsafeHTML = false;
    await renderMessageSimple(message, {
      actionsEnabled,
      messageListRect,
      unsafeHTML,
    });
    expect(MessageTextMock).toHaveBeenCalledWith(
      expect.objectContaining({
        actionsEnabled,
        message,
        messageListRect,
        reactionSelectorRef: expect.any(Object),
        unsafeHTML,
      }),
      {},
    );
  });

  it('should display detailed reactions when reactions action is clicked', async () => {
    const message = generateAliceMessage({ text: undefined });
    const { queryByTestId } = await renderMessageSimple(
      message,
      {},
      { reactions: true },
    );
    const { onReactionListClick } = MessageOptionsMock.mock.calls[0][0];
    act(() => onReactionListClick());
    expect(queryByTestId(reactionSelectorTestId)).toBeInTheDocument();
  });

  it('should display non image attachments in Attachment component when message has attachments that are not images', async () => {
    const attachment = {
      asset_url: 'file.pdf',
      type: 'file',
    };
    const message = generateAliceMessage({
      attachments: [attachment, attachment, attachment],
    });
    const { queryAllByTestId } = await renderMessageSimple(message);
    expect(queryAllByTestId('attachment-file')).toHaveLength(3);
  });

  it('should display image attachments in gallery when message has image attachments', async () => {
    const attachment = {
      image_url: 'image.jpg',
      type: 'image',
    };
    const message = generateAliceMessage({
      attachments: [attachment, attachment, attachment],
    });
    const { queryAllByTestId } = await renderMessageSimple(message);
    expect(queryAllByTestId('gallery-image')).toHaveLength(3);
  });

  it('should display reply count and handle replies count button click when not in thread list and reply count is not 0', async () => {
    const message = generateAliceMessage({
      reply_count: 1,
    });
    const { getByTestId } = await renderMessageSimple(message);
    expect(getByTestId('replies-count-button')).toBeInTheDocument();
  });

  it('should open thread when reply count button is clicked', async () => {
    const message = generateAliceMessage({
      reply_count: 1,
    });
    const { getByTestId } = await renderMessageSimple(message);
    expect(openThreadMock).not.toHaveBeenCalled();
    fireEvent.click(getByTestId('replies-count-button'));
    expect(openThreadMock).toHaveBeenCalledWith(
      message,
      expect.any(Object), // The event object
    );
  });

  it("should display message's user name when message not from the current user", async () => {
    const message = generateBobMessage();
    const { getByText } = await renderMessageSimple(message);
    expect(getByText(bob.name)).toBeInTheDocument();
  });

  it("should display message's timestamp with calendar formatting", async () => {
    const messageDate = new Date('2019-12-12T03:33:00');
    const message = generateAliceMessage({
      created_at: messageDate,
    });
    const { getByText } = await renderMessageSimple(message);
    expect(getByText('12/12/2019')).toBeInTheDocument();
  });
});
