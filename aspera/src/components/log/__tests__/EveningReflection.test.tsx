import React from "react";
import { render, fireEvent, screen } from "@testing-library/react-native";
import EveningReflection from "../EveningReflection";

describe("EveningReflection — relevance, not completion", () => {
  it("shows today's focus read-only with no done/partial/missed buttons", () => {
    render(
      <EveningReflection
        bigRocks={["Ship the deck"]}
        reflectionNote={undefined}
        depthPrompt={null}
        depthValue={undefined}
        onChange={() => {}}
      />,
    );
    expect(screen.getByText("1. Ship the deck")).toBeTruthy();
    // Completion tracking was removed — none of these outcome controls exist.
    expect(screen.queryByText("Done")).toBeNull();
    expect(screen.queryByText("Partial")).toBeNull();
    expect(screen.queryByText("Missed")).toBeNull();
  });

  it("renders no depth tap when depthPrompt is null", () => {
    render(
      <EveningReflection
        bigRocks={["x"]}
        reflectionNote={undefined}
        depthPrompt={null}
        depthValue={undefined}
        onChange={() => {}}
      />,
    );
    expect(screen.queryByText("Did today feel meaningful?")).toBeNull();
  });
});

describe("EveningReflection — depth tap", () => {
  it("shows the selected pillar prompt and reports pillar + value on tap", () => {
    const onChange = jest.fn();
    render(
      <EveningReflection
        bigRocks={["x"]}
        reflectionNote={"note"}
        depthPrompt={"meaning"}
        depthValue={undefined}
        onChange={onChange}
      />,
    );
    expect(screen.getByText("Did today feel meaningful?")).toBeTruthy();
    fireEvent.press(screen.getByText("Yes"));
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ depthPillar: "meaning", depthValue: "yes" }),
    );
  });
});
