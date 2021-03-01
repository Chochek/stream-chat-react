import React from 'react';

import renderer from 'react-test-renderer';

import { cleanup, render } from '@testing-library/react';
import Dayjs from 'dayjs';
import calendar from 'dayjs/plugin/calendar';
import '@testing-library/jest-dom';

import { TranslationContext } from '../../../context';
import DateSeparator from '../DateSeparator';

Dayjs.extend(calendar);

afterEach(cleanup); // eslint-disable-line

// this changes every time tests are run,
// but by mocking the actual renderers tests are still deterministic
const now = new Date();

const withContext = (props) => {
  const t = jest.fn((key) => key);
  const tDateTimeParser = jest.fn((input) => Dayjs(input));
  const Component = (
    <TranslationContext.Provider value={{ t, tDateTimeParser }}>
      <DateSeparator {...props} />
    </TranslationContext.Provider>
  );

  return { Component, t, tDateTimeParser };
};

describe('DateSeparator', () => {
  it('should use formatDate if it is provided', () => {
    const { queryByText } = render(
      <DateSeparator date={now} formatDate={() => 'the date'} />,
    );

    expect(queryByText('the date')).toBeInTheDocument();
  });

  it('should render New text if unread prop is true', () => {
    const { Component, t } = withContext({ date: now, unread: true });
    const { queryByText } = render(Component);

    expect(queryByText('New')).toBeInTheDocument();
    expect(t).toHaveBeenCalledWith('New');
  });

  it('should render properly for unread', () => {
    const { Component } = withContext({ date: now, unread: true });
    const tree = renderer.create(Component).toJSON();
    expect(tree).toMatchInlineSnapshot(`
      <div
        className="str-chat__date-separator"
      >
        <hr
          className="str-chat__date-separator-line"
        />
        <div
          className="str-chat__date-separator-date"
        >
          New
        </div>
      </div>
    `);
  });

  it("should use tDateTimeParser's calendar method by default", () => {
    const { Component, tDateTimeParser } = withContext({ date: now });
    const { queryByText } = render(Component);

    expect(tDateTimeParser).toHaveBeenCalledWith(now.toISOString());
    expect(
      queryByText(Dayjs(now.toISOString()).calendar()),
    ).toBeInTheDocument();
  });

  describe('Position prop', () => {
    const renderWithPosition = (position) => (
      <DateSeparator
        date={now}
        formatDate={() => 'the date'}
        position={position}
      />
    );

    const defaultPosition = renderer.create(renderWithPosition()).toJSON();

    it('should render correctly with position==="right", and it should match the default', () => {
      const tree = renderer.create(renderWithPosition('right')).toJSON();
      expect(tree).toMatchInlineSnapshot(`
        <div
          className="str-chat__date-separator"
        >
          <hr
            className="str-chat__date-separator-line"
          />
          <div
            className="str-chat__date-separator-date"
          >
            the date
          </div>
        </div>
      `);
      expect(defaultPosition).toStrictEqual(tree);
    });

    it('should render correctly with position==="left"', () => {
      const tree = renderer.create(renderWithPosition('left')).toJSON();
      expect(tree).toMatchInlineSnapshot(`
        <div
          className="str-chat__date-separator"
        >
          <div
            className="str-chat__date-separator-date"
          >
            the date
          </div>
          <hr
            className="str-chat__date-separator-line"
          />
        </div>
      `);
    });

    it('should render correctly with position==="center"', () => {
      const tree = renderer.create(renderWithPosition('center')).toJSON();
      expect(tree).toMatchInlineSnapshot(`
        <div
          className="str-chat__date-separator"
        >
          <hr
            className="str-chat__date-separator-line"
          />
          <div
            className="str-chat__date-separator-date"
          >
            the date
          </div>
          <hr
            className="str-chat__date-separator-line"
          />
        </div>
      `);
    });
  });
});
