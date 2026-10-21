import React, { useId } from "react";
import { FAMILY } from "./content";
import { CREATURE_ART } from "./art";
export function Sigil({
  family,
  stage = 1,
  size = "md",
  color = "Normal",
  effect = "Normal",
}: {
  family: string;
  stage?: number;
  size?: string;
  color?: string;
  effect?: string;
}) {
  const f = FAMILY[family];
  const art = CREATURE_ART[`${family}-${stage}`];
  const clipId = useId().replaceAll(":", "");
  const [x, y, w, h] = art.box;
  const pad = Math.max(w, h) * 0.055;
  return (
    <div
      role="img"
      aria-label={`${f.names[stage - 1]}, ${color} color, ${effect} effect`}
      data-form={`${family}-${stage}`}
      className={`sigil ${f.element.toLowerCase()} ${size} ${color.toLowerCase()} ${effect.toLowerCase()}`}
    >
      <svg
        className="creature-art"
        viewBox={`${x - pad} ${y - pad} ${w + pad * 2} ${h + pad * 2}`}
        aria-hidden="true"
      >
        <defs>
          <clipPath id={`${clipId}-row`} clipPathUnits="userSpaceOnUse">
            <path d={art.clip} />
          </clipPath>
          <clipPath id={`${clipId}-col`} clipPathUnits="userSpaceOnUse">
            <path d={art.column} />
          </clipPath>
          {color === "Prismatic" && (
            <filter id={`${clipId}-prism`} colorInterpolationFilters="sRGB">
              <feColorMatrix type="saturate" values="0" />
              <feComponentTransfer>
                <feFuncR
                  type="table"
                  tableValues=".06 .24 .25 .08 .12 .8 1 1"
                />
                <feFuncG
                  type="table"
                  tableValues=".04 .06 .18 .65 .9 .8 .35 1"
                />
                <feFuncB type="table" tableValues=".13 .48 .9 1 .5 .2 .25 1" />
              </feComponentTransfer>
            </filter>
          )}
        </defs>
        <g clipPath={`url(#${clipId}-row)`}>
          <g clipPath={`url(#${clipId}-col)`}>
            <image
              href={`./${art.atlas}`}
              width={art.width}
              height={art.height}
              filter={
                color === "Prismatic" ? `url(#${clipId}-prism)` : undefined
              }
            />
          </g>
        </g>
      </svg>
    </div>
  );
}
