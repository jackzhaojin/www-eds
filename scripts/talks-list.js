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

/** A place line that says the talk was held on the web (a webinar), not in a room. */
const ONLINE = /^(online|virtual)$/i;

/**
 * An Event's location. In a room: a Place, the place line as its name and its address. Online
 * (since v1.7.6): a VirtualLocation at the event's own page, the row's "View event source" link,
 * or at the row itself when it links no event page.
 */
function eventLocation(place, online, url) {
  if (online) return { location: { '@type': 'VirtualLocation', url } };
  return place ? { location: { '@type': 'Place', name: place, address: place } } : {};
}

/**
 * The ItemList entries: an Event per row, with the write-up and project the row links. Google
 * checks every Event, a superEvent too, typed or not, for a start date and a location: an address
 * for one held in a room, a URL for one held online. So the place line is the Place's address as
 * well, an "Online" place line makes the Event an online one, and the conference, whose own dates
 * the row doesn't hold, is the talk's organizer rather than a superEvent.
 */
export function talkSchemaItems(talks, canonical) {
  return talks.filter((talk) => talk.id && talk.title).map((talk) => {
    const { event, place } = eventParts(talk.event);
    const startDate = isoDate(talk.date);
    const links = talk.links.map((link) => ({ label: link.label, url: new URL(link.href, `${SITE}/`) }));
    const site = links.map((link) => link.url).filter((url) => url.origin === SITE);
    const online = ONLINE.test(place);
    const eventPage = links.find((link) => link.url.origin !== SITE && /event/i.test(link.label));
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
      eventAttendanceMode: `https://schema.org/${online ? 'Online' : 'Offline'}EventAttendanceMode`,
      eventStatus: 'https://schema.org/EventScheduled',
      performer: { '@id': PERSON['@id'] },
      ...(event ? { organizer: { '@type': 'Organization', name: event } } : {}),
      ...eventLocation(place, online, eventPage ? eventPage.url.href : `${canonical}#${talk.id}`),
      ...(writeup ? { subjectOf: { '@type': 'BlogPosting', url: `${SITE}${writeup.pathname}` } } : {}),
      ...(project ? { about: { '@id': `${SITE}${project.pathname}#project` } } : {}),
    };
  });
}
