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
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "./input-group";
import { cn } from "./lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";

export type ColorPickerProps = Pick<
  RAColorPickerProps,
  "value" | "onChange" | "defaultValue"
>;

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
    <InputGroupInput
      {...inputProps}
      ref={inputRef}
      data-slot="input-group-control"
      className="flex-1 rounded-none border-0 bg-transparent font-mono text-sm uppercase shadow-none outline-none ring-0 focus-visible:ring-0"
    />
  );
}

export function ColorPicker(props: ColorPickerProps) {
  return (
    <ColorPickerPrimitive {...props}>
      <Popover>
        <InputGroup className="w-32">
          <InputGroupAddon align="inline-start">
            <PopoverTrigger render={<InputGroupButton />}>
              <ColorSwatch className="size-4 rounded-sm border border-black/10" />
            </PopoverTrigger>
          </InputGroupAddon>
          <HexColorInput />
        </InputGroup>
        <PopoverContent align="start" className="w-48">
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
        </PopoverContent>
      </Popover>
    </ColorPickerPrimitive>
  );
}
