"use client";

import * as React from "react";
import * as RechartsPrimitive from "recharts";
import { cn } from "../lib/utils";

// Chart theming: colors are defined per series in a ChartConfig and exposed
// to recharts through CSS variables (var(--color-<key>)) so they follow the
// light/dark palette automatically.
export type ChartConfig = {
  [k in string]: {
    label?: React.ReactNode;
    icon?: React.ComponentType;
  } & (
    | { color?: string; theme?: never }
    | { color?: never; theme: Record<"light" | "dark", string> }
  );
};

type ChartContextProps = {
  config: ChartConfig;
};

const ChartContext = React.createContext<ChartContextProps | null>(null);

function useChart(): ChartConfig {
  const context = React.useContext(ChartContext);

  if (!context) {
    throw new Error("useChart must be used within a <ChartContainer />");
  }

  return context.config;
}

const ChartContainer = ({
  id,
  className,
  children,
  config,
  ...props
}: React.ComponentProps<"div"> & {
  config: ChartConfig;
  children: React.ComponentProps<typeof RechartsPrimitive.ResponsiveContainer>["children"];
}) => {
  const uniqueId = React.useId();
  const chartId = `chart-${id ?? uniqueId.replace(/:/g, "")}`;

  return (
    <ChartContext.Provider value={{ config }}>
      <div
        data-chart={chartId}
        className={cn(
          "flex aspect-video justify-center text-xs [&_.recharts-cartesian-axis-tick_text]:fill-muted-foreground [&_.recharts-cartesian-grid_line]:stroke-border [&_.recharts-curve.recharts-tooltip-cursor]:stroke-border [&_.recharts-layer]:outline-hidden [&_.recharts-sector]:outline-hidden [&_.recharts-surface]:outline-hidden",
          className,
        )}
        {...props}
      >
        <ChartStyle id={chartId} config={config} />
        <RechartsPrimitive.ResponsiveContainer>{children}</RechartsPrimitive.ResponsiveContainer>
      </div>
    </ChartContext.Provider>
  );
};

const ChartStyle = ({ id, config }: { id: string; config: ChartConfig }) => {
  const colorConfig = Object.entries(config).filter(([, configItem]) => configItem.theme ?? configItem.color);

  if (!colorConfig.length) {
    return null;
  }

  return (
    <style
      dangerouslySetInnerHTML={{
        __html: `[data-chart=${id}] {
${colorConfig
  .map(([key, itemConfig]) => {
    const color = itemConfig.color ?? itemConfig.theme?.light;
    return `  --color-${key}: ${color};`;
  })
  .join("\n")}
}

.dark [data-chart=${id}] {
${colorConfig
  .map(([key, itemConfig]) => {
    const color = itemConfig.theme?.dark ?? itemConfig.color;
    return `  --color-${key}: ${color};`;
  })
  .join("\n")}
}
`,
      }}
    />
  );
};

const ChartTooltip = RechartsPrimitive.Tooltip;

type TooltipPayloadItem = {
  name?: string | number;
  dataKey?: string | number;
  value?: string | number | Array<unknown>;
  color?: string;
  fill?: string;
  payload?: { fill?: string; [key: string]: unknown };
};

const ChartTooltipContent = ({
  active,
  payload,
  className,
  indicator = "dot",
  label,
  labelFormatter,
  hideLabel = false,
}: {
  active?: boolean;
  payload?: TooltipPayloadItem[];
  className?: string;
  indicator?: "line" | "dot" | "dashed";
  label?: string | number;
  labelFormatter?: (label: string | number, payload: TooltipPayloadItem[]) => React.ReactNode;
  hideLabel?: boolean;
}) => {
  const config = useChart();

  if (!active || !payload?.length) {
    return null;
  }

  return (
    <div
      className={cn(
        "grid min-w-[8rem] items-start gap-1.5 rounded-lg border border-border bg-popover px-2.5 py-1.5 text-xs shadow-xl",
        className,
      )}
    >
      {!hideLabel && payload.length > 0 ? (
        <div className="leading-none font-medium text-popover-foreground">
          {label != null && labelFormatter ? labelFormatter(label, payload) : label}
        </div>
      ) : null}
      <div className="grid gap-1.5">
        {payload.map((item, index) => {
          const key = String(item.dataKey ?? item.name ?? `item-${index}`);
          const itemConfig = config[key];
          const indicatorColor = item.color ?? item.fill ?? item.payload?.fill;

          return (
            <div
              key={item.dataKey ?? index}
              className={cn(
                "flex w-full flex-wrap items-stretch gap-2",
                indicator === "dot" && "items-center",
              )}
            >
              {itemConfig?.icon ? (
                <itemConfig.icon aria-hidden="true" />
              ) : (
                <span
                  className={cn("shrink-0 rounded-[2px]", {
                    "h-2.5 w-2.5": indicator === "dot",
                    "w-0": indicator === "line",
                    "w-2 border-t-2 border-dashed": indicator === "dashed",
                  })}
                  style={{ backgroundColor: indicatorColor }}
                />
              )}
              <span className="flex h-3.5 w-full flex-wrap items-center gap-1.5 leading-none font-medium text-popover-foreground">
                {itemConfig?.label ?? item.name}
              </span>
              <span className="text-muted-foreground leading-none font-mono font-medium tabular-nums text-popover-foreground">
                {item.value == null ? "—" : String(item.value)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const ChartLegend = RechartsPrimitive.Legend;

const ChartLegendContent = ({
  className,
  payload,
}: {
  className?: string;
  payload?: Array<{ dataKey?: string | number; value?: string | number; color?: string }>;
}) => {
  const config = useChart();

  if (!payload?.length) {
    return null;
  }

  return (
    <div className={cn("flex items-center justify-center gap-4", className)}>
      {payload.map((item, index) => {
        const key = String(item.dataKey ?? `legend-${index}`);
        const itemConfig = config[key];

        return (
          <div
            key={key}
            className="flex items-center gap-1.5 text-xs [&>svg]:h-3 [&>svg]:w-3 text-muted-foreground [&>svg]:text-muted-foreground"
          >
            {itemConfig?.icon ? (
              <itemConfig.icon aria-hidden="true" />
            ) : (
              <span
                className="size-2.5 shrink-0 rounded-[2px]"
                style={{ backgroundColor: item.color }}
              />
            )}
            {itemConfig?.label ?? item.value}
          </div>
        );
      })}
    </div>
  );
};

export { ChartContainer, ChartLegend, ChartLegendContent, ChartStyle, ChartTooltip, ChartTooltipContent };
