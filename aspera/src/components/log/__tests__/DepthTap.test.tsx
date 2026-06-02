import React from "react";
import { render, fireEvent, screen } from "@testing-library/react-native";
import DepthTap from "../DepthTap";

describe("DepthTap", () => {
  it("renders the prompt and three options", () => {
    render(<DepthTap prompt="Did today feel meaningful?" value={undefined} onChange={() => {}} />);
    expect(screen.getByText("Did today feel meaningful?")).toBeTruthy();
    expect(screen.getByText("Yes")).toBeTruthy();
    expect(screen.getByText("Somewhat")).toBeTruthy();
    expect(screen.getByText("No")).toBeTruthy();
  });

  it("calls onChange with the tapped value", () => {
    const onChange = jest.fn();
    render(<DepthTap prompt="x" value={undefined} onChange={onChange} />);
    fireEvent.press(screen.getByText("Somewhat"));
    expect(onChange).toHaveBeenCalledWith("somewhat");
  });
});
