import { ClusterNetwork, useCluster } from "./cluster-data-access";
import { View, Text } from "react-native";
import { ClusterPickerRadioButtonGroupRow } from "./cluster-ui";

function clusternetworkToIndex(clusterName: string): number {
  switch (clusterName) {
    case ClusterNetwork.Devnet:
      return 0;
    case ClusterNetwork.Testnet:
      return 1;
    default:
      throw Error("Invalid cluster selected");
  }
}

export default function ClusterPickerFeature() {
  const { selectedCluster, clusters, setSelectedCluster } = useCluster();
  const [devNetCluster, testNetCluster] = clusters;

  const handleClusterChange = (newClusterNetwork: string) => {
    setSelectedCluster(clusters[clusternetworkToIndex(newClusterNetwork)]);
  };

  return (
    <View>
      <Text style={{ fontSize: 24, fontWeight: "bold" }}>Cluster:</Text>
      <View>
        <ClusterPickerRadioButtonGroupRow
          cluster={devNetCluster}
          isSelected={selectedCluster.network === devNetCluster.network}
          onSelect={() => handleClusterChange(devNetCluster.network)}
        />
        <ClusterPickerRadioButtonGroupRow
          cluster={testNetCluster}
          isSelected={selectedCluster.network === testNetCluster.network}
          onSelect={() => handleClusterChange(testNetCluster.network)}
        />
      </View>
    </View>
  );
}
