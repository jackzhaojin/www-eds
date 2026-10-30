/**
 * The talks hub's structured data, from its authored rows (blocks/row-list, talks): an Event per
 * talk in the page's ItemList. Since v1.3.0 a talk has no page of its own. Its row on /talks/
 * links straight out to the recording or the event, and a talk about a project is a story on the
 * project's page, with the recording. The rows are authored, so the browser writes this graph,
 * on www as on preview hosts.
 */
import { isoDate } from './page-schema.js';
import { PERSON } from './collection-schema.js';

const SITE = 'https://www.jackzhaojin.com';

/** The event line, "Event · Place · with co-speakers": the event and the place. */
export function eventParts(text) {
  const [event, place] = (text || '').split(/\s+·\s+/).map((part) => part.trim());
  return { event: event || '', place: place && !/^with\b/i.test(place) ? place : '' };
}

/**
 * A decorated talk row (an li of .row-list-items) as data: its id, title, date, kind, event
 * line, description and links ({ label, href } with href as authored).
 */
export function readTalkRow(li) {
  const text = (selector) => li.querySelector(selector)?.textContent.trim() || '';
  return {
    id: li.id,
    title: text('.row-list-title'),
    date: text('.row-list-date'),
    kind: text('.row-list-type'),
    event: text('.row-list-event'),
    description: [...li.querySelectorAll('.row-list-description p')]
      .map((p) => p.textContent.trim()).filter(Boolean).join(' '),
    links: [...li.querySelectorAll('.row-list-links a')]
      .map((a) => ({ label: a.textContent.trim(), href: a.getAttribute('href') })),
  };
}

/** The ItemList entries: an Event per row, with the write-up and project the row links. */
export function talkSchemaItems(talks, canonical) {
  return talks.filter((talk) => talk.id && talk.title).map((talk) => {
    const { event, place } = eventParts(talk.event);
    const startDate = isoDate(talk.date);
    const site = talk.links.map((link) => new URL(link.href, `${SITE}/`))
      .filter((url) => url.origin === SITE);
    const writeup = site.find((url) => /^\/writing\/[^/]+\/$/.test(url.pathname));
    const project = site.find((url) => /^\/portfolio\/[^/]+\/$/.test(url.pathname));
    return {
      '@type': 'Event',
      '@id': `${canonical}#${talk.id}`,
      url: `${canonical}#${talk.id}`,
      name: talk.title,
      ...(talk.description ? { description: talk.description } : {}),
      ...(startDate ? { startDate } : {}),
      ...(talk.kind ? { additionalType: talk.kind } : {}),
      performer: { '@id': PERSON['@id'] },
      ...(event ? { superEvent: { '@type': 'Event', name: event } } : {}),
      ...(place ? { location: { '@type': 'Place', name: place } } : {}),
      ...(writeup ? { subjectOf: { '@type': 'BlogPosting', url: `${SITE}${writeup.pathname}` } } : {}),
      ...(project ? { about: { '@id': `${SITE}${project.pathname}#project` } } : {}),
    };
  });
}
