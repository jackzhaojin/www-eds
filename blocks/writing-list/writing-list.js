/**
 * Writing list: the Technical Writing listing (css/site.css .writing-list and .writing-row).
 * One row per article, newest first. Cells are classified by content:
 * - meta (the cell with lists): the date paragraph (wrapped in a <time>), the topics list (one
 *   chip per item; a known topic gets its dot color and filter key) and the facts list (the
 *   reading time, then the video length, which carries the video icon);
 * - body (the cell with the heading): the heading with the article link (the link covers the
 *   whole row), the summary paragraph, a talk link paragraph followed by its note paragraph,
 *   and the Watch on YouTube link paragraph;
 * - cover (the cell with the image): decorative, the row link names the article;
 * - keywords (an optional cell of plain paragraphs): search terms beyond the visible text, and
 *   optionally the title runs to keep on one line (Sign-in, Members-Only): a paragraph of comma
 *   separated parts that all occur in the title. Each run gets a nowrap span (the source marks
 *   them title by title), a presentation refinement that keeps the text.
 * Year marks split the list by year. The writing-filter widget filters the rows in place and
 * reads each row's date, topics and search text from the data attributes set here. The section
 * metadata key label names the section for assistive tech (the source's aria-label).
 *
 * @ew-exempt keywords: search terms and keep-together runs, hidden (.writing-list-keywords)
 * @variants (none)
 */

import decorate from '../../scripts/writing-list.js';

export default decorate;
