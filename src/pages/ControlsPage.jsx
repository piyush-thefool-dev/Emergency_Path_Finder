/**
 * Controls Page (Mobile Tab).
 * Routing Algorithm, Triage Filters, Congestion Scenarios, and Incident Reporting.
 */

import { Sliders } from 'lucide-react';
import MobilePageHeader from '../components/layout/MobilePageHeader.jsx';
import ControlPanel from '../components/panels/ControlPanel.jsx';
import IncidentTool from '../components/map/IncidentTool.jsx';
import ApiStatusPanel from '../components/panels/ApiStatusPanel.jsx';
import { useDispatch } from '../context/DispatchContext.jsx';

export function ControlsPage() {
  const { graph, routing, apiHealth } = useDispatch();

  return (
    <div className="page-shell">
      <MobilePageHeader
        icon={Sliders}
        title="Dispatch Controls"
        subtitle="Triage Specialty, Weather & Road Incidents"
        backTo="/"
      />
      <div className="px-3.5 pt-3.5 pb-8 space-y-4 font-mono">
        <ControlPanel
          emergencyCategory={routing.emergencyCategory}
          onSelectCategory={routing.setEmergencyCategory}
          timeOfDay={graph.timeOfDay}
          onChangeTimeOfDay={graph.setTimeOfDay}
          weather={graph.weather}
          onChangeWeather={graph.setWeather}
          signalPriority={graph.signalPriority}
          onToggleSignalPriority={graph.setSignalPriority}
          graphMode={graph.graphMode}
          onChangeGraphMode={graph.setGraphMode}
          onDownloadOverpass={graph.fetchFreshOverpassGrid}
          isDownloadingOverpass={graph.isDownloadingOverpass}
          overpassError={graph.overpassDownloadError}
          useLiveWeather={graph.useLiveWeather}
          onToggleLiveWeather={graph.toggleLiveWeather}
          liveWeather={graph.liveWeather}
          onRefreshWeather={graph.refreshLiveWeather}
          isFetchingWeather={graph.isFetchingWeather}
          trafficConfig={graph.trafficConfig}
        />

        <ApiStatusPanel health={apiHealth} />

        <IncidentTool
          edges={graph.weightedGraph.edges}
          nodes={graph.weightedGraph.nodes}
          incidents={graph.incidents}
          ambulancePos={routing.ambulancePos}
          reporter={graph.reporter}
          onChangeReporter={graph.setReporter}
          onAddIncident={graph.addIncident}
          onRemoveIncident={graph.removeIncident}
          onClearIncidents={graph.clearIncidents}
        />
      </div>
    </div>
  );
}

export default ControlsPage;
