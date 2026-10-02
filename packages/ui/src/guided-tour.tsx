import { useWindowDimensions } from "react-native";
import { Portal, View } from "tamagui";
import { Button } from "./controls";
import type { LabeledAction } from "./controls";
import { Card, Row, Stack, Text } from "./layout";
import { border, shadow, size, space } from "./tokens";

export interface TourTarget {
  top: number;
  left: number;
  width: number;
  height: number;
}

export interface GuidedTourProps {
  title: string;
  description: string;
  step: number;
  total: number;
  /** The highlighted element in window coordinates; the card sits on the opposite half. */
  target: TourTarget | null;
  back: LabeledAction;
  next: LabeledAction;
  skip: LabeledAction;
}

/** Four bands that dim everything around the target and leave it lit. */
const scrimBands = ({ top, left, width, height }: TourTarget) => [
  { top: 0, left: 0, right: 0, height: Math.max(0, top) },
  { top: top + height, left: 0, right: 0, bottom: 0 },
  { top, left: 0, width: Math.max(0, left), height },
  { top, left: left + width, right: 0, height },
];

export function GuidedTour({
  title,
  description,
  step,
  total,
  target,
  back,
  next,
  skip,
}: GuidedTourProps) {
  const { height } = useWindowDimensions();
  const targetBelow =
    target !== null && target.top + target.height / 2 > height / 2;
  return (
    <Portal zIndex="$overlay">
      <Stack
        position="absolute"
        inset={0}
        pointerEvents="box-none"
        aria-live="polite"
      >
        {target ? (
          <>
            {scrimBands(target).map((band, index) => (
              <View
                key={index}
                position="absolute"
                {...band}
                backgroundColor="$scrim"
                pointerEvents="none"
                aria-hidden
              />
            ))}
            <View
              position="absolute"
              {...target}
              borderWidth={border.emphasis}
              borderColor="$accent"
              borderRadius="$card"
              pointerEvents="none"
              aria-hidden
            />
          </>
        ) : null}
        <Stack
          position="absolute"
          left="$xl"
          right="$xl"
          {...(targetBelow
            ? { top: "$huge" }
            : // Clears a bottom tab bar, which may be the next highlighted target.
              { bottom: size.row + space.xl })}
          alignItems="center"
          pointerEvents="box-none"
        >
          <Card
            role="dialog"
            aria-label={title}
            width="100%"
            maxWidth="$sheetWidth"
            boxShadow={shadow.floating}
          >
            <Row justifyContent="space-between">
              <Text variant="title" flex={1}>
                {title}
              </Text>
              <Text variant="caption" color="$colorMuted">
                {step} / {total}
              </Text>
            </Row>
            <Text color="$colorSubtle">{description}</Text>
            <Row flexWrap="wrap" justifyContent="flex-end" gap="$sm">
              <Button variant="ghost" onPress={skip.onPress}>
                {skip.label}
              </Button>
              <Button
                variant="secondary"
                disabled={step <= 1}
                onPress={back.onPress}
              >
                {back.label}
              </Button>
              <Button onPress={next.onPress}>{next.label}</Button>
            </Row>
          </Card>
        </Stack>
      </Stack>
    </Portal>
  );
}
