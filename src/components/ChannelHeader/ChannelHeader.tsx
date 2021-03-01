import React from 'react';

import type {
  DefaultAttachmentType,
  DefaultChannelType,
  DefaultCommandType,
  DefaultEventType,
  DefaultMessageType,
  DefaultReactionType,
  DefaultUserType,
  UnknownType,
} from '../../../types/types';
import { useChannelContext } from '../../context/ChannelContext';
import { useChatContext } from '../../context/ChatContext';
import { useTranslationContext } from '../../context/TranslationContext';
import { AvatarProps, Avatar as DefaultAvatar } from '../Avatar';

export type ChannelHeaderProps = {
  /**
   * Custom UI component to display user avatar.
   *
   * Defaults to and accepts same props as: [Avatar](https://github.com/GetStream/stream-chat-react/blob/master/src/components/Avatar/Avatar.tsx)
   * */
  Avatar?: React.ComponentType<AvatarProps>;
  /** Manually set the image to render, defaults to the channel image */
  image?: string;
  /** Show a little indicator that the channel is live right now */
  live?: boolean;
  /** Set title manually */
  title?: string;
};

const UnMemoizedChannelHeader = <
  At extends UnknownType = DefaultAttachmentType,
  Ch extends DefaultChannelType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType
>(
  props: ChannelHeaderProps,
) => {
  const { Avatar = DefaultAvatar, image: propImage, live, title } = props;

  const { channel, watcher_count } = useChannelContext<
    At,
    Ch,
    Co,
    Ev,
    Me,
    Re,
    Us
  >();
  const { openMobileNav } = useChatContext<At, Ch, Co, Ev, Me, Re, Us>();
  const { t } = useTranslationContext();

  const { image: channelImage, member_count, name, subtitle } =
    channel?.data || {};

  const image = propImage || channelImage;

  return (
    <div className='str-chat__header-livestream'>
      <div className='str-chat__header-hamburger' onClick={openMobileNav}>
        <span className='str-chat__header-hamburger--line'></span>
        <span className='str-chat__header-hamburger--line'></span>
        <span className='str-chat__header-hamburger--line'></span>
      </div>
      {image && (
        <Avatar
          image={image}
          shape='rounded'
          size={channel?.type === 'commerce' ? 60 : 40}
        />
      )}
      <div className='str-chat__header-livestream-left'>
        <p className='str-chat__header-livestream-left--title'>
          {title || name}{' '}
          {live && (
            <span className='str-chat__header-livestream-left--livelabel'>
              {t('live')}
            </span>
          )}
        </p>
        {subtitle && (
          <p className='str-chat__header-livestream-left--subtitle'>
            {subtitle}
          </p>
        )}
        <p className='str-chat__header-livestream-left--members'>
          {!live && !!member_count && member_count > 0 && (
            <>
              {t('{{ memberCount }} members', {
                memberCount: member_count,
              })}
              ,{' '}
            </>
          )}
          {t('{{ watcherCount }} online', { watcherCount: watcher_count })}
        </p>
      </div>
    </div>
  );
};

export const ChannelHeader = React.memo(
  UnMemoizedChannelHeader,
) as typeof UnMemoizedChannelHeader;
