import "./App.css";
import { useState, useEffect } from "react";

function App() {
  const [route, setRoute] = useState("");
  const [correctRoute, setCorrectRoute] = useState("");
  const [directionResult, setDirectionResult] = useState([]);
  const [search, setSearch] = useState(false);
  const [station, setStation] = useState(false);
  const [stationNameList, setStationNameList] = useState([]);
  const [searchETA, setsearchETA] = useState(false);
  const [stationETA, setStationETA] = useState("");

  const getRouteDataAPI = "https://data.etabus.gov.hk/v1/transport/kmb/route";
  const getRouteBusStopAPI =
    "https://data.etabus.gov.hk/v1/transport/kmb/route-stop";
  const getStationName = "https://data.etabus.gov.hk/v1/transport/kmb/stop";
  const getETA = "https://data.etabus.gov.hk/v1/transport/kmb/eta/";

  const handleClick = async () => {
    const cleanedRoute = route.replace(/\s/g, "").toUpperCase(); // Remove all spaces
    if (cleanedRoute) {
      setStation(false);
      setsearchETA(false);
      setCorrectRoute(cleanedRoute);

      const result = await getDirection(cleanedRoute);
      setSearch(true);
      setDirectionResult(result);
    }
  };

  const handleSubmit = (event) => {
    event.preventDefault();
  };

  const handleDirectionClick = async (routeDetails) => {
    const stationName = await getStation(routeDetails);
    setStationNameList(stationName);
    setStation(true);
  };

  useEffect(() => {
    correctRoute && getDirection(correctRoute);
  }, [correctRoute]);

  async function getDirection(route) {
    const data = await fetch(getRouteDataAPI);
    const res = await data.json();
    const result = [];
    for (let key in res.data) {
      if (res.data[key]["route"] === route) result.push(res.data[key]);
    }

    const routedirection = result.map((direction) => [
      `${direction["orig_tc"]}->${direction["dest_tc"]}`,
      direction["bound"],
      direction["route"],
      direction["service_type"],
    ]);

    return routedirection;
  }

  async function getStation(routeDetails) {
    const bound = routeDetails[1] === "I" ? "inbound" : "outbound";
    const type = routeDetails[3];
    const stop = [];
    const stopName = [];
    const data = await fetch(`${getRouteBusStopAPI}/${route}/${bound}/${type}`);
    const res = await data.json();

    for (let key in res["data"]) {
      stop.push(res["data"][key]["stop"]);
    }

    const stopNameObject = await Promise.all(
      stop.map(async (el) => {
        const data = await fetch(`${getStationName}/${el}`);
        const res = await data.json();
        return res;
      })
    );

    for (let key in stopNameObject) {
      stopName.push({
        Name: stopNameObject[key]["data"]["name_tc"],
        ID: stopNameObject[key]["data"]["stop"],
        Bound: routeDetails[1],
        Type: routeDetails[3],
      });
    }
    return stopName;
  }

  function RouteButton({ directionResult, onClick }) {
    return (
      <>
        <div>請選擇路線：</div>
        {directionResult.map((el, index) => (
          <button key={index} onClick={() => onClick(el)}>
            {el[0]}
          </button>
        ))}
      </>
    );
  }

  function StationList({ stationNameList, findETA }) {
    return (
      <div className="station">
        {stationNameList.map((el, index) => (
          <div
            key={index}
            className="StationName"
            onClick={() => {
              findETA(el);
            }}
          >
            {el.Name}
          </div>
        ))}
      </div>
    );
  }

  async function findETA(stationName) {
    const data = await fetch(
      `${getETA}/${stationName.ID}/${route}/${stationName.Type}`
    );
    const res = await data.json();
    const eta = res.data.map((el) => {
      return `${el.eta.slice(11, 16)} ${el.rmk_tc}`;
    });
    console.log(eta);
    setsearchETA(true);
    setStationETA(eta);
  }

  function ETA({ stationETA }) {
    return (
      <div className="eta">
        <p className="label">以下為到站時間</p>
        {stationETA.map((el, index) => (
          <div key={index}>{el}</div>
        ))}
      </div>
    );
  }

  return (
    <div className="App">
      <header className="Search">
        <p className="busName">Please Enter the line number</p>
        <form onSubmit={handleSubmit}>
          <input
            value={route}
            onChange={(event) => setRoute(event.target.value)}
          ></input>
          <button type="button" onClick={handleClick}>
            Search
          </button>
        </form>
      </header>
      <nav>
        {search && directionResult.length > 0 && (
          <RouteButton
            directionResult={directionResult}
            onClick={handleDirectionClick}
          />
        )}
        {search && directionResult.length === 0 && (
          <div>路線錯誤 請重新輸入</div>
        )}
      </nav>
      <main>
        {station && (
          <StationList stationNameList={stationNameList} findETA={findETA} />
        )}
        {searchETA && stationETA.length !== 0 && (
          <ETA stationETA={stationETA} />
        )}
      </main>
    </div>
  );
}

export default App;
