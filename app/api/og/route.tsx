import { ImageResponse } from "@vercel/og";

import { ogImageSchema } from "@/lib/validations/og";

export const runtime = "edge";

const interRegular = fetch(
  new URL("../../../assets/fonts/Inter-Regular.ttf", import.meta.url),
).then((res) => res.arrayBuffer());

const interBold = fetch(
  new URL("../../../assets/fonts/CalSans-SemiBold.ttf", import.meta.url),
).then((res) => res.arrayBuffer());

export async function GET(req: Request) {
  try {
    const fontRegular = await interRegular;
    const fontBold = await interBold;

    const url = new URL(req.url);
    const values = ogImageSchema.parse(Object.fromEntries(url.searchParams));
    const heading =
      values.heading.length > 80
        ? `${values.heading.substring(0, 100)}...`
        : values.heading;

    const { mode } = values;
    const paint = mode === "dark" ? "#fff" : "#000";

    const fontSize = heading.length > 80 ? "60px" : "80px";

    return new ImageResponse(
      <div
        tw="flex relative flex-col p-12 w-full h-full items-start"
        style={{
          color: paint,
          background:
            mode === "dark"
              ? "linear-gradient(90deg, #000 0%, #111 100%)"
              : "white",
        }}
      >
        <div
          tw="text-5xl"
          style={{
            fontFamily: "Cal Sans",
            fontWeight: "normal",
            position: "relative",
            background: "linear-gradient(90deg, #14d4e0, #0f5fa8 80%)",
            backgroundClip: "text",
            color: "transparent",
          }}
        >
          FastLearners
        </div>

        <div tw="flex flex-col flex-1 py-16">
          {/* Type : Blog or Doc */}
          <div
            tw="flex text-xl uppercase font-bold tracking-tight"
            style={{ fontFamily: "Inter", fontWeight: "normal" }}
          >
            {values.type}
          </div>
          {/* Title */}
          <div
            tw="flex leading-[1.15] text-[80px] font-bold"
            style={{
              fontFamily: "Cal Sans",
              fontWeight: "bold",
              marginLeft: "-3px",
              fontSize,
            }}
          >
            {heading}
          </div>
        </div>

        <div tw="flex items-center w-full justify-between">
          <div
            tw="flex items-center text-xl"
            style={{ fontFamily: "Inter", fontWeight: "normal" }}
          >
            <div
              tw="flex items-center justify-center text-3xl font-bold"
              style={{
                width: "65px",
                height: "65px",
                borderRadius: 128,
                background: "linear-gradient(135deg, #14d4e0, #0f5fa8)",
                color: "#fff",
                fontFamily: "Cal Sans",
              }}
            >
              F
            </div>

            <div tw="flex flex-col" style={{ marginLeft: "18px" }}>
              <div tw="text-[22px]" style={{ fontFamily: "Cal Sans" }}>
                FastLearners Limited
              </div>
              <div>Smarter learning for Nigerian students</div>
            </div>
          </div>

          <div
            tw="flex items-center text-xl"
            style={{ fontFamily: "Inter", fontWeight: "normal" }}
          >
            <div tw="flex ml-2">fastlearnersapp.com</div>
          </div>
        </div>
      </div>,
      {
        width: 1200,
        height: 630,
        fonts: [
          {
            name: "Inter",
            data: fontRegular,
            weight: 400,
            style: "normal",
          },
          {
            name: "Cal Sans",
            data: fontBold,
            weight: 700,
            style: "normal",
          },
        ],
      },
    );
  } catch (error) {
    return new Response(`Failed to generate image`, {
      status: 500,
    });
  }
}
