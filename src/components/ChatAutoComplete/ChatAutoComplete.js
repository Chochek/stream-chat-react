import React, { useCallback, useContext, useMemo } from 'react';

import debounce from 'lodash.debounce';
import PropTypes from 'prop-types';

import { ChannelContext } from '../../context';
import { AutoCompleteTextarea } from '../AutoCompleteTextarea';
import { CommandItem } from '../CommandItem';
import { EmoticonItem } from '../EmoticonItem';
import { LoadingIndicator } from '../Loading';
import { UserItem } from '../UserItem';

/** @type {React.FC<import("types").ChatAutoCompleteProps>} */
const ChatAutoComplete = (props) => {
  const { commands, onSelectItem, triggers } = props;

  const { channel, emojiConfig } = useContext(ChannelContext);

  const members = channel?.state?.members;
  const watchers = channel?.state?.watchers;
  const { emojiData, EmojiIndex } = emojiConfig || {};

  const emojiIndex = useMemo(() => {
    if (EmojiIndex) {
      return new EmojiIndex(emojiData);
    }
    return null;
  }, [emojiData, EmojiIndex]);

  /** @param {string} word */
  const emojiReplace = (word) => {
    const found = emojiIndex?.search(word) || [];
    const emoji = found.slice(0, 10).find(
      /** @type {{ ({ emoticons } : import('emoji-mart').EmojiData): boolean }} */
      ({ emoticons }) => !!emoticons?.includes(word),
    );
    if (!emoji || !('native' in emoji)) return null;
    return emoji.native;
  };

  const getMembersAndWatchers = useCallback(() => {
    const memberUsers = members
      ? Object.values(members).map(({ user }) => user)
      : [];
    const watcherUsers = watchers ? Object.values(watchers) : [];
    const users = [...memberUsers, ...watcherUsers];
    // make sure we don't list users twice
    /** @type {{ [key: string]: import('stream-chat').UserResponse<import('types').StreamChatReactUserType> }} */
    const uniqueUsers = {};
    users.forEach((user) => {
      if (user && !uniqueUsers[user.id]) {
        uniqueUsers[user.id] = user;
      }
    });
    return Object.values(uniqueUsers);
  }, [members, watchers]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const queryMembersDebounced = useCallback(
    debounce(
      /**
       * @param {string} query
       * @param {(data: any[]) => void} onReady
       */
      async (query, onReady) => {
        if (!channel?.queryMembers) return;
        const response = await channel?.queryMembers({
          name: { $autocomplete: query },
        });
        const users = response.members.map((m) => m.user);
        if (onReady) onReady(users);
      },
      200,
    ),
    [channel?.queryMembers],
  );

  /**
   * dataProvider accepts `onReady` function, which will executed once the data is ready.
   * Another approach would have been to simply return the data from dataProvider and let the
   * component await for it and then execute the required logic. We are going for callback instead
   * of async-await since we have debounce function in dataProvider. Which will delay the execution
   * of api call on trailing end of debounce (lets call it a1) but will return with result of
   * previous call without waiting for a1. So in this case, we want to execute onReady, when trailing
   * end of debounce executes.
   * @type {() => import("../AutoCompleteTextarea/types").TriggerMap | object}
   */
  const getTriggers = useCallback(
    () =>
      triggers || {
        '/': {
          component: CommandItem,
          dataProvider: (q, text, onReady) => {
            if (text.indexOf('/') !== 0 || !commands) {
              return [];
            }
            const selectedCommands = commands.filter(
              (c) => c.name?.indexOf(q) !== -1,
            );

            // sort alphabetically unless the you're matching the first char
            selectedCommands.sort((a, b) => {
              let nameA = a.name?.toLowerCase();
              let nameB = b.name?.toLowerCase();
              if (nameA?.indexOf(q) === 0) {
                nameA = `0${nameA}`;
              }
              if (nameB?.indexOf(q) === 0) {
                nameB = `0${nameB}`;
              }
              // Should confirm possible null / undefined when TS is fully implemented
              if (nameA != null && nameB != null) {
                if (nameA < nameB) {
                  return -1;
                }
                if (nameA > nameB) {
                  return 1;
                }
              }

              return 0;
            });

            const result = selectedCommands.slice(0, 10);
            if (onReady) onReady(result, q);

            return result;
          },
          output: (entity) => ({
            caretPosition: 'next',
            key: entity.id,
            text: `/${entity.name}`,
          }),
        },
        ':': {
          component: EmoticonItem,
          dataProvider: (q, text, onReady) => {
            if (q.length === 0 || q.charAt(0).match(/[^a-zA-Z0-9+-]/)) {
              return [];
            }
            const emojis = emojiIndex?.search(q) || [];
            const result = emojis.slice(0, 10);

            if (onReady) onReady(result, q);

            return result;
          },
          output: (entity) => ({
            caretPosition: 'next',
            key: entity.id,
            text: `${entity.native}`,
          }),
        },
        '@': {
          callback: (item) => onSelectItem && onSelectItem(item),
          component: UserItem,
          dataProvider: (query, text, onReady) => {
            // By default, we return maximum 100 members via queryChannels api call.
            // Thus it is safe to assume, that if number of members in channel.state is < 100,
            // then all the members are already available on client side and we don't need to
            // make any api call to queryMembers endpoint.
            if (!query || Object.values(members || {}).length < 100) {
              const users = getMembersAndWatchers();

              const matchingUsers = users.filter((user) => {
                if (!query) return true;
                if (
                  user.name !== undefined &&
                  user.name.toLowerCase().includes(query.toLowerCase())
                ) {
                  return true;
                }
                return user.id.toLowerCase().includes(query.toLowerCase());
              });
              const data = matchingUsers.slice(0, 10);

              if (onReady) onReady(data, query);

              return data;
            }
            return queryMembersDebounced(
              query,
              /** @param {any[]} data */
              (data) => {
                if (onReady) onReady(data, query);
              },
            );
          },
          output: (entity) => ({
            caretPosition: 'next',
            key: entity.id,
            text: `@${entity.name || entity.id}`,
          }),
        },
      },
    [
      commands,
      getMembersAndWatchers,
      members,
      onSelectItem,
      queryMembersDebounced,
      triggers,
      emojiIndex,
    ],
  );

  const { innerRef } = props;

  const updateInnerRef = useCallback(
    (ref) => {
      if (innerRef) innerRef.current = ref;
    },
    [innerRef],
  );

  return (
    <AutoCompleteTextarea
      additionalTextareaProps={props.additionalTextareaProps}
      className='str-chat__textarea__textarea'
      containerClassName='str-chat__textarea'
      disabled={props.disabled}
      disableMentions={props.disableMentions}
      dropdownClassName='str-chat__emojisearch'
      grow={props.grow}
      handleSubmit={props.handleSubmit}
      innerRef={updateInnerRef}
      itemClassName='str-chat__emojisearch__item'
      listClassName='str-chat__emojisearch__list'
      loadingComponent={LoadingIndicator}
      maxRows={props.maxRows}
      minChar={0}
      onChange={props.onChange}
      onFocus={props.onFocus}
      onPaste={props.onPaste}
      placeholder={props.placeholder}
      replaceWord={emojiReplace}
      rows={props.rows}
      SuggestionList={props.SuggestionList}
      trigger={getTriggers()}
      value={props.value}
    />
  );
};

ChatAutoComplete.propTypes = {
  /**
   * Any additional attributes that you may want to add for underlying HTML textarea element.
   */
  additionalTextareaProps: PropTypes.object,
  /** Array of [commands](https://getstream.io/chat/docs/#channel_commands) */
  commands: PropTypes.array,
  /** Make the textarea disabled */
  disabled: PropTypes.bool,
  /** Disable mentions */
  disableMentions: PropTypes.bool,
  /** Grow the number of rows of the textarea while you're typing */
  grow: PropTypes.bool,
  /** Function that runs on submit */
  handleSubmit: PropTypes.func,
  /** What loading component to use for the auto complete when loading results. */
  LoadingIndicator: /** @type {PropTypes.Validator<React.ElementType<import('types').LoadingIndicatorProps>>} */ (PropTypes.elementType),
  /** Maximum number of rows */
  maxRows: PropTypes.number,
  /** Minimum number of Character */
  minChar: PropTypes.number,
  /** Function that runs on change */
  onChange: PropTypes.func,
  /** Listener for onfocus event on textarea */
  onFocus: PropTypes.func,
  /** Function to run on pasting within the textarea */
  onPaste: PropTypes.func,
  /**
   * Handler for selecting item from suggestions list
   *
   * @param item Selected item object.
   *  */
  onSelectItem: PropTypes.func,
  /** Placeholder for the textarea */
  placeholder: PropTypes.string,
  /** The number of rows you want the textarea to have */
  rows: PropTypes.number,
  /** Optional UI component prop to override the default List component that displays suggestions */
  SuggestionList: /** @type {PropTypes.Validator<React.ElementType<import('types').SuggestionListProps>>} */ (PropTypes.elementType),
  /** The value of the textarea */
  value: PropTypes.string,
};

ChatAutoComplete.defaultProps = {
  rows: 3,
};

export default React.memo(ChatAutoComplete);
