import type { MessageResponse } from 'stream-chat';

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
import { useChannelContext } from '../../../context/ChannelContext';

export const useOpenThreadHandler = <
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType
>(
  message?: MessageResponse<At, Ch, Co, Me, Re, Us>,
  customOpenThread?: (
    message: MessageResponse<At, Ch, Co, Me, Re, Us>,
    event: React.SyntheticEvent,
  ) => void,
) => {
  const { openThread: channelOpenThread } = useChannelContext<
    At,
    Ch,
    Co,
    Ev,
    Me,
    Re,
    Us
  >();

  const openThread = customOpenThread || channelOpenThread;

  return (event: React.SyntheticEvent) => {
    if (!openThread || !message) {
      console.warn(
        'Open thread handler was called but it is missing one of its parameters',
      );
      return;
    }

    openThread(message, event);
  };
};
