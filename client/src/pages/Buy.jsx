import React from "react";
import BuyCondition from "./BuyCondition";

// Legacy page kept for compatibility.
// In MERN version, /buy routes to BuyCondition directly.
export default function Buy() {
  return <BuyCondition useDropdown={true} />;
}
