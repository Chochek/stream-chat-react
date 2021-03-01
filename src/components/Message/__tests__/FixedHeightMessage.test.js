import React from 'react';

import { cleanup, render } from '@testing-library/react';

import '@testing-library/jest-dom';
import {
  generateChannel,
  generateMessage,
  generateUser,
  getTestClientWithUser,
} from 'mock-builders';

import {
  ChannelContext,
  ChatContext,
  TranslationContext,
} from '../../../context';
import { Avatar as AvatarMock } from '../../Avatar';
import { Gallery as GalleryMock } from '../../Gallery';
import { MessageActions as MessageActionsMock } from '../../MessageActions';
import { MML as MMLMock } from '../../MML';
import { FixedHeightMessage } from '../FixedHeightMessage';

jest.mock('../../Avatar', () => ({ Avatar: jest.fn(() => <div />) }));
jest.mock('../../MML', () => ({ MML: jest.fn(() => <div />) }));
jest.mock('../../Gallery', () => ({ Gallery: jest.fn(() => <div />) }));
jest.mock('../../MessageActions', () => ({
  MessageActions: jest.fn((props) => props.getMessageActions()),
}));

const aliceProfile = { image: 'alice-avatar.jpg', name: 'alice' };
const alice = generateUser(aliceProfile);
const bob = generateUser({ name: 'bob' });

async function renderMsg(message) {
  const channel = generateChannel();
  const client = await getTestClientWithUser(alice);
  const customDateTimeParser = jest.fn(() => ({ format: jest.fn() }));

  return render(
    <ChatContext.Provider value={{ theme: 'dark' }}>
      <ChannelContext.Provider value={{ channel, client }}>
        <TranslationContext.Provider
          value={{
            t: (key) => key,
            tDateTimeParser: customDateTimeParser,
            userLanguage: 'en',
          }}
        >
          <FixedHeightMessage message={message} />
        </TranslationContext.Provider>
      </ChannelContext.Provider>
    </ChatContext.Provider>,
  );
}

describe('<FixedHeightMessage />', () => {
  afterEach(cleanup);
  beforeEach(jest.clearAllMocks);

  it('should render message text', async () => {
    const message = generateMessage({ user: alice });
    const { getByTestId } = await renderMsg(message);
    expect(getByTestId('msg-text')).toHaveTextContent(message.text);
  });

  it('should render message images', async () => {
    const image = { image_url: 'image.jpg', type: 'image' };
    const attachments = [image, image, image];
    const message = generateMessage({ attachments, user: alice });
    await renderMsg(message);
    expect(GalleryMock).toHaveBeenCalledWith({ images: attachments }, {});
  });

  it('should render user avatar', async () => {
    const message = generateMessage({ user: alice });
    await renderMsg(message);
    expect(AvatarMock).toHaveBeenCalledWith(
      expect.objectContaining(aliceProfile),
      {},
    );
  });

  it('should render MML', async () => {
    const mml = '<mml>text</mml>';
    const message = generateMessage({ mml, user: alice });
    await renderMsg(message);
    expect(MMLMock).toHaveBeenCalledWith(
      expect.objectContaining({ align: 'left', source: mml }),
      {},
    );
  });

  it('should render message action for owner', async () => {
    const message = generateMessage({ user: alice });
    await renderMsg(message);
    expect(MessageActionsMock).toHaveBeenCalledWith(
      expect.objectContaining({ message }),
      {},
    );
    expect(MessageActionsMock).toHaveReturnedWith(['delete']);
  });

  it('should not render message action for others', async () => {
    const message = generateMessage({ user: bob });
    await renderMsg(message);
    expect(MessageActionsMock).toHaveReturnedWith([]);
  });

  it('should display text in users set language', async () => {
    const message = generateMessage({
      i18n: { en_text: 'hello', fr_text: 'bonjour', language: 'fr' },
      text: 'bonjour',
      user: alice,
    });

    const { getByText } = await renderMsg(message);

    expect(getByText('hello')).toBeInTheDocument();
  });
});
