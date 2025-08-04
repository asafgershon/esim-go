import { Almanac } from "json-rules-engine";
import z from "zod";
import { MarkupEvent } from "../blocks/markups";
import { PreviousBundleFact, SelectedBundleFact } from "../facts/bundle-facts";
import { ActionType } from "../generated/types";

const markupActionSchema = z.object({
  type: z.enum(ActionType),
  markupValue: z.number(),
});

export async function processMarkups(events: MarkupEvent[], almanac: Almanac) {
  const selectedBundle = await almanac.factValue<SelectedBundleFact>(
    "selectedBundle"
  );
  const previousBundle = await almanac.factValue<PreviousBundleFact>(
    "previousBundle"
  );
  const unusedDays = await almanac.factValue<number>("unusedDays");

  const daysToMarkUp = events.reduce((acc, event) => {
    const action = markupActionSchema.parse(event.params.action);
    acc[event.params.validityInDays] = action.markupValue;
    return acc;
  }, {} as Record<number, number>);

  const selectedBundleMarkup =
    daysToMarkUp[selectedBundle?.validity_in_days || 0];
  const previousBundleMarkup =
    daysToMarkUp[previousBundle?.validity_in_days || 0];

  const daysDiff = selectedBundleMarkup - previousBundleMarkup;

  const discountPerDay =
    (selectedBundleMarkup - previousBundleMarkup) / daysDiff;

  const discount = discountPerDay * unusedDays;

  return selectedBundleMarkup - discount;
}
