import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";
export default buildModule("PosterModule", (m) => ({ poster: m.contract("Poster") }));
