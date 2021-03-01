import { useEffect } from 'react';

import type { Channel, Event } from 'stream-chat';

import type {
  DefaultAttachmentType,
  DefaultChannelType,
  DefaultCommandType,
  DefaultEventType,
  DefaultMessageType,
  DefaultReactionType,
  DefaultUserType,
  UnknownType,
} from '../../../../types/types';
import { useChatContext } from '../../../context/ChatContext';

export const useNotificationRemovedFromChannelListener = <
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType
>(
  setChannels: React.Dispatch<
    React.SetStateAction<Array<Channel<At, Ch, Co, Ev, Me, Re, Us>>>
  >,
  customHandler?: (
    setChannels: React.Dispatch<
      React.SetStateAction<Array<Channel<At, Ch, Co, Ev, Me, Re, Us>>>
    >,
    event: Event<At, Ch, Co, Ev, Me, Re, Us>,
  ) => void,
) => {
  const { client } = useChatContext<At, Ch, Co, Ev, Me, Re, Us>();

  useEffect(() => {
    const handleEvent = (event: Event<At, Ch, Co, Ev, Me, Re, Us>) => {
      if (customHandler && typeof customHandler === 'function') {
        customHandler(setChannels, event);
      } else {
        setChannels((channels) =>
          channels.filter((channel) => channel.cid !== event.channel?.cid),
        );
      }
    };

    client.on('notification.removed_from_channel', handleEvent);

    return () => {
      client.off('notification.removed_from_channel', handleEvent);
    };
  }, [customHandler]);
};
