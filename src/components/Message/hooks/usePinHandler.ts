import type { MouseEvent } from 'react';

import type { MessageResponse, UpdatedMessage } from 'stream-chat';

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
import { useTranslationContext } from '../../../context/TranslationContext';
import { validateAndGetMessage } from '../utils';

export type PinEnabledUserRoles = {
  [key: string]: boolean;
  // admin?: boolean;
  // anonymous?: boolean;
  // channel_member?: boolean;
  // channel_moderator?: boolean;
  // guest?: boolean;
  // member?: boolean;
  // moderator?: boolean;
  // owner?: boolean;
  // user?: boolean;
};

export type PinPermissions = {
  [key: string]: PinEnabledUserRoles;
  // commerce?: PinEnabledUserRoles;
  // gaming?: PinEnabledUserRoles;
  // livestream?: PinEnabledUserRoles;
  // messaging?: PinEnabledUserRoles;
  // team?: PinEnabledUserRoles;
};

export type PinMessageNotifications<
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType
> = {
  getErrorNotification?: (
    message: MessageResponse<At, Ch, Co, Me, Re, Us>,
  ) => string;
  notify?: (notificationText: string, type: 'success' | 'error') => void;
};

export const usePinHandler = <
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType
>(
  message?: MessageResponse<At, Ch, Co, Me, Re, Us>,
  permissions?: PinPermissions,
  notifications: PinMessageNotifications<At, Ch, Co, Me, Re, Us> = {},
) => {
  const { getErrorNotification, notify } = notifications;

  const { channel, client } = useChannelContext<At, Ch, Co, Ev, Me, Re, Us>();
  const { t } = useTranslationContext();

  const canPin = () => {
    if (
      !client?.userID ||
      !channel?.state ||
      !permissions ||
      !permissions[channel.type]
    ) {
      return false;
    }

    const currentChannelPermissions = permissions[channel.type];
    const currentChannelMember = channel.state.members[client.userID];
    const currentChannelWatcher = channel.state.watchers[client.userID];

    if (
      currentChannelPermissions &&
      typeof client.user?.role === 'string' &&
      currentChannelPermissions[client.user.role]
    ) {
      return true;
    }

    if (
      currentChannelMember &&
      typeof currentChannelMember.role === 'string' &&
      currentChannelPermissions[currentChannelMember.role]
    ) {
      return true;
    }

    if (
      currentChannelWatcher &&
      typeof currentChannelWatcher.role === 'string' &&
      currentChannelPermissions[currentChannelWatcher.role]
    ) {
      return true;
    }

    return false;
  };

  const handlePin = async (event: MouseEvent<HTMLElement>) => {
    event.preventDefault();

    if (!message) return;

    if (!message.pinned) {
      try {
        await client.pinMessage(
          message as UpdatedMessage<At, Ch, Co, Me, Re, Us>,
        );
      } catch (e) {
        const errorMessage =
          getErrorNotification &&
          validateAndGetMessage(getErrorNotification, [message]);

        if (notify) notify(errorMessage || t('Error pinning message'), 'error');
      }
    } else {
      try {
        await client.unpinMessage(
          message as UpdatedMessage<At, Ch, Co, Me, Re, Us>,
        );
      } catch (e) {
        const errorMessage =
          getErrorNotification &&
          validateAndGetMessage(getErrorNotification, [message]);

        if (notify)
          notify(errorMessage || t('Error removing message pin'), 'error');
      }
    }
  };

  return { canPin: canPin(), handlePin };
};
