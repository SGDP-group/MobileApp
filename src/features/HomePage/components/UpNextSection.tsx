import { useNavigation } from "@react-navigation/native";
import { RootNavigationProp } from "@shared/navigation/RootNavigator";
import React, { useMemo, useRef, useState } from "react";
import { FlatList, Text, TouchableOpacity, View } from "react-native";
import type { HomeTask, HomeUpNextItem } from "../home.tasks";
import { styles } from "../styles/home.styles";
import { UpNextCard } from "./UpNextCard";

const UP_NEXT_CARD_SNAP_INTERVAL = 234;

type ViewableItemsEvent = {
  viewableItems: Array<{ index: number | null }>;
};

interface UpNextSectionProps {
  upNextData: HomeUpNextItem[];
  onOpenTaskQueue: (task?: HomeTask) => void;
}

export function UpNextSection({ upNextData, onOpenTaskQueue }: UpNextSectionProps) {
  const navigation = useNavigation<RootNavigationProp>();
  const [currentScrollIndex, setCurrentScrollIndex] = useState(0);

  const viewabilityConfig = useMemo(
    () => ({ itemVisiblePercentThreshold: 50 }),
    [],
  );

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: ViewableItemsEvent) => {
      if (viewableItems.length > 0 && viewableItems[0].index !== null) {
        setCurrentScrollIndex(viewableItems[0].index);
      }
    },
  ).current;

  return (
    <>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Up Next</Text>
        <TouchableOpacity onPress={() => navigation.navigate("Calendar") }>
          <Text style={styles.sectionAction}>View Tasks</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={upNextData}
        renderItem={({ item }) => (
          <UpNextCard item={item} onOpenTaskQueue={onOpenTaskQueue} />
        )}
        keyExtractor={(item) => item.id}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.upNextRow}
        nestedScrollEnabled
        decelerationRate={0.99}
        snapToInterval={UP_NEXT_CARD_SNAP_INTERVAL}
        snapToAlignment="center"
        getItemLayout={(_, index) => ({
          length: UP_NEXT_CARD_SNAP_INTERVAL,
          offset: UP_NEXT_CARD_SNAP_INTERVAL * index,
          index,
        })}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
      />

      {upNextData.length > 1 && upNextData[0].type === "task" && (
        <View style={styles.scrollIndicatorContainer}>
          {upNextData.map((_, index) => (
            <View
              key={index}
              style={[
                styles.scrollDot,
                index === currentScrollIndex && styles.scrollDotActive,
              ]}
            />
          ))}
        </View>
      )}
    </>
  );
}
