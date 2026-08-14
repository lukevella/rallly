"use client";

import { useColorField } from "@react-aria/color";
import { useColorFieldState } from "@react-stately/color";
import React from "react";
import type {
  Color,
  ColorPickerProps as RAColorPickerProps,
} from "react-aria-components";
import {
  ColorArea,
  ColorPicker as ColorPickerPrimitive,
  ColorPickerStateContext,
  ColorSlider,
  ColorSwatch,
  ColorThumb,
  SliderTrack,
} from "react-aria-components";
import { Button } from "./button";
import { Input } from "./input";
import { cn } from "./lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";

export type ColorPickerProps = Pick<
  RAColorPickerProps,
  "value" | "onChange" | "defaultValue"
> & {
  className?: string;
  disabled?: boolean;
  /** Applied to the swatch trigger, which is the control an external label names. */
  "aria-labelledby"?: string;
  "aria-describedby"?: string;
};

export type { Color };
export { parseColor } from "react-aria-components";

function HexColorInput() {
  const pickerState = React.useContext(ColorPickerStateContext);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const state = useColorFieldState({
    value: pickerState?.color ?? undefined,
    onChange: (color: Color | null) => {
      if (color) pickerState?.setColor(color);
    },
  });

  const { inputProps } = useColorField(
    { "aria-label": "Hex color" },
    state,
    inputRef,
  );

  return (
    <Input
      {...inputProps}
      ref={inputRef}
      className="mt-2 h-8 w-full font-mono text-sm uppercase"
    />
  );
}

export function ColorPicker({
  className,
  disabled,
  "aria-labelledby": labelledBy,
  "aria-describedby": describedBy,
  ...props
}: ColorPickerProps) {
  return (
    <ColorPickerPrimitive {...props}>
      <Popover>
        <PopoverTrigger
          render={
            <Button
              variant="default"
              size="icon"
              disabled={disabled}
              className={className}
              aria-labelledby={labelledBy}
              aria-describedby={describedBy}
              {...(labelledBy ? {} : { "aria-label": "Choose color" })}
            />
          }
        >
          <ColorSwatch className="size-5 rounded-sm border border-black/10" />
        </PopoverTrigger>
        <PopoverContent align="end" className="w-48">
          <ColorArea
            colorSpace="hsb"
            xChannel="saturation"
            yChannel="brightness"
            className="w-full rounded-md"
            style={{ height: 148 }}
          >
            <ColorThumb
              className={cn(
                "top-[50%] left-[50%] size-4 rounded-full border-2 border-white shadow-md outline-none",
                "data-[focus-visible]:ring-2 data-[focus-visible]:ring-offset-1",
              )}
            />
          </ColorArea>
          <ColorSlider colorSpace="hsb" channel="hue" className="w-full">
            <SliderTrack className="mt-2 h-3 w-full rounded-full">
              <ColorThumb
                className={cn(
                  "top-[50%] size-4 rounded-full border-2 border-white shadow-md outline-none",
                  "data-[focus-visible]:ring-2 data-[focus-visible]:ring-offset-1",
                )}
              />
            </SliderTrack>
          </ColorSlider>
          <HexColorInput />
        </PopoverContent>
      </Popover>
    </ColorPickerPrimitive>
  );
}
