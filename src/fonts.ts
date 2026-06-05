import { loadFont } from "@remotion/fonts";
import { staticFile } from "remotion";

loadFont({
  family: "ABCGravity",
  url: staticFile("ABCGravityVariable.ttf"),
  weight: "900",
  style: "normal",
});

loadFont({
  family: "RobotoMono",
  url: staticFile("RobotoMono-SemiBold.woff2"),
  weight: "600",
  style: "normal",
});
