import { relativeTime } from '../time';

describe('relativeTime', () => {
  it('should convert milliseconds to minutes and seconds', () => {
    expect(relativeTime(102, 30)).toBe('Just now');
  });

  it('should print ago if the current time is less than the previous', () => {
    expect(relativeTime(62000, 1)).toBe('1 minute ago');
  });

  it('should print in if the elapsed time is less than 0', () => {
    expect(relativeTime(1, 700000)).toBe('in 12 minutes');
  });

  it('should print in if the elapsed time is less than 0', () => {
    expect(relativeTime(1, 62000)).toBe('in 1 minute');
  });

  it('should return just now when previous is NaN', () => {
    expect(relativeTime(1000, NaN)).toBe('Just now');
  });

  it('should return just now if elapsed is less than 0', () => {
    expect(relativeTime(1000, 2000)).toBe('Just now');
  });

  it('should return formatted time in minutes when elapsed time is less than an hour', () => {
    const current = 1708976688173;
    const previous = current - 30 * 60 * 1000; // 30 minutes ago
    expect(relativeTime(current, previous)).toBe('30 minutes ago');
  });

  it('should return formatted time in hours when elapsed time is less than a day', () => {
    const current = 1708976688173;
    const previous = current - 6 * 60 * 60 * 1000; // 6 hours ago
    expect(relativeTime(current, previous)).toBe('6 hours ago');
  });

  it('should return formatted time in days when elapsed time is less than a month', () => {
    const current = 1708976688173;
    const previous = current - 2 * 24 * 60 * 60 * 1000; // 2 days ago
    expect(relativeTime(current, previous)).toBe('2 days ago');
  });

  it('should return formatted time in months when elapsed time is less than a year', () => {
    const current = 1708976688173;
    const previous = current - 2 * 30 * 24 * 60 * 60 * 1000; // 2 months ago
    expect(relativeTime(current, previous)).toBe('2 months ago');
  });

  it('should return formatted date when elapsed time is more than a year', () => {
    const current = 1708976688173;
    const previous = current - 2 * 365 * 24 * 60 * 60 * 1000; // 2 years ago
    expect(relativeTime(current, previous)).toMatch(/\d{1,2} [A-Za-z]+ \d{4}/); // Matches "01 Jan 2022" format
  });

  it('should get the correct month', () => {
    expect(relativeTime(2500, 1610859600000).split(' ')[1]).toBe('Jan');
    expect(relativeTime(2500, 1613538000000).split(' ')[1]).toBe('Feb');
    expect(relativeTime(2500, 1615953600000).split(' ')[1]).toBe('Mar');
    expect(relativeTime(2500, 1618632000000).split(' ')[1]).toBe('April');
    expect(relativeTime(2500, 1621224000000).split(' ')[1]).toBe('May');
    expect(relativeTime(2500, 1623902400000).split(' ')[1]).toBe('June');
    expect(relativeTime(2500, 1626494400000).split(' ')[1]).toBe('July');
    expect(relativeTime(2500, 1629172800000).split(' ')[1]).toBe('August');
    expect(relativeTime(2500, 1631851200000).split(' ')[1]).toBe('Sept');
    expect(relativeTime(2500, 1634443200000).split(' ')[1]).toBe('Oct');
    expect(relativeTime(2500, 1637125200000).split(' ')[1]).toBe('Nov');
    expect(relativeTime(2500, 1639717200000).split(' ')[1]).toBe('Dec');
  });
});
