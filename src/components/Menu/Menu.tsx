import useGlobalState from "../../hooks/useGlobalState";

export default function Menu() {
  const {
    setValue,
    state,
  } = useGlobalState();
  return (
    <>
      <button className="hamburger" onClick={() => setValue("showOptions", (v) => !v)}></button>
      <div className={["options", state.showOptions ? "show" : "hide"].join(" ")}>
      <button className="close-options" onClick={() => setValue("showOptions", false)}></button>
      <div className="options-list">
        <div>
          <input name="showContour" type="checkbox" checked={state.showContour} onChange={() => setValue("showContour", (v) => !v)} />
          <label htmlFor="showContour">Show Contour</label>
        </div>
        <div>
          <input name="showPoints" type="checkbox" checked={state.showPoints} onChange={() => setValue("showPoints", (v) => !v)} />
          <label htmlFor="showPoints">Show Control Points</label>
        </div>
        <div>
          <select name="terrainMaterial" onChange={(e) => setValue("terrainMaterial", e.target.value as 'heightMap' | 'mapMaterial' | 'slopeMap')}>
            <option value="heightMap">Terrain</option>
            <option value="mapMaterial">Map</option>
            <option value="slopeMap">Slope</option>
          </select>
        </div>
      </div>
    </div>
  </>
  )
}