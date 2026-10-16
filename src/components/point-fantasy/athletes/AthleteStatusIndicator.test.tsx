import React from "react";
import { afterEach, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { AthleteStatusIndicator, athleteCatalogStatus } from "./AthleteStatusIndicator";

afterEach(cleanup);
it.each([[7,"Provável"],[2,"Dúvida"],[5,"Contundido"],[3,"Suspenso"],[6,"Nulo"]] as const)("renders official status %i as %s with an accessible SVG", (statusId, name) => {
  render(<AthleteStatusIndicator statusId={statusId} />);
  const icon=screen.getByRole("img",{name});
  expect(icon.tagName.toLowerCase()).toBe("svg");
  expect(icon.querySelector("title")?.textContent).toBe(`Condição: ${name}`);
  expect(icon.getAttribute("width")).toBe("16");
  expect(athleteCatalogStatus(statusId)).toBe(name);
});
it.each([undefined,null,0,999,NaN])("does not turn missing or unknown status %s into Nulo", statusId => {
  const {container}=render(<AthleteStatusIndicator statusId={statusId} />);
  expect(container.innerHTML).toBe(""); expect(athleteCatalogStatus(statusId)).toBeNull();
});
it("uses different SVG shapes and palettes for all five known states", () => {
  const signatures=[7,2,5,3,6].map(statusId => {
    const {container,unmount}=render(<AthleteStatusIndicator statusId={statusId} />);
    const signature=container.querySelector("svg")!.innerHTML;unmount();return signature;
  });
  expect(new Set(signatures).size).toBe(5);
});
it("updates with the supplied catalog value without keeping the previous condition", () => {
  const {rerender}=render(<AthleteStatusIndicator statusId={7} />);
  rerender(<AthleteStatusIndicator statusId={5} />);
  expect(screen.queryByRole("img",{name:"Provável"})).toBeNull(); expect(screen.getByRole("img",{name:"Contundido"})).toBeTruthy();
  rerender(<AthleteStatusIndicator />); expect(screen.queryByRole("img")).toBeNull();
});
