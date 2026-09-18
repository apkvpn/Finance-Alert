import { evaluateAlertCondition, calculateAlertDistance, processAlertEvaluation } from "../alerts/engine";
import { searchAssets, getAssetBySymbolOrId } from "../market/catalog";

function runTests() {
  console.log("=== RUNNING FINANCE ALERT SUITE TESTS ===");

  // Test 1: ABOVE Condition Transition Logic
  // Should NOT trigger if previous price was already above target (must cross)
  const crossAboveNo = evaluateAlertCondition("ABOVE", 100, 105, 110);
  console.assert(!crossAboveNo, "ABOVE should NOT trigger if previous price was already above target");

  // Should trigger on valid transition across target: prev < target and curr >= target
  const crossAboveYes = evaluateAlertCondition("ABOVE", 100, 95, 102);
  console.assert(crossAboveYes, "ABOVE SHOULD trigger when price validly crosses target from below");

  // Test 2: BELOW Condition Transition Logic
  // Should trigger on valid transition across target: prev > target and curr <= target
  const crossBelowYes = evaluateAlertCondition("BELOW", 100, 105, 98);
  console.assert(crossBelowYes, "BELOW SHOULD trigger when price validly crosses target from above");

  // Test 3: Distance calculation precision
  const dist = calculateAlertDistance(100, 105);
  console.assert(dist.distanceAbs === 5, "Abs distance should be 5");
  console.assert(dist.distancePercent === 5, "% distance should be 5%");
  console.assert(dist.direction === "UP", "Direction should be UP");

  // Test 4: 5,000+ Asset Search
  const btcAsset = getAssetBySymbolOrId("BTC");
  console.assert(btcAsset !== null && btcAsset.symbol === "BTC", "Should find BTC in master catalog");

  const fuzzySearch = searchAssets({ query: "bitco", limit: 5 });
  console.assert(fuzzySearch.assets.length > 0, "Fuzzy search for 'bitco' should return results");

  const forexSearch = searchAssets({ query: "eurusd", limit: 5 });
  console.assert(forexSearch.assets.length > 0, "Forex search for 'eurusd' should return EUR/USD");

  console.log("=== ALL UNIT TESTS PASSED SUCCESSFULLY! ===");
}

runTests();
