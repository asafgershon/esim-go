import { Almanac, Event } from "json-rules-engine";
import { EventType } from "src/types";

export const processEvents = async (events: Event[], almanac: Almanac) => {};

export const selectEvents = (
  events: Event[],
  type: EventType,
  selector?: (event: Event) => boolean
) => {
  let select = (event: Event) => event.type === type;
  if (selector) {
    select = (event) => event.type === type && selector(event);
  }
  return events.filter(select);
};
