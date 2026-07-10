// Node.js simulation to verify React asynchronous closure vs synchronous useRef lock behavior

console.log("--- TESTING DOUBLE-SUBMIT DISPATCH COUNTS ---");

function simulateSubmissions(useRefLock = false) {
  let dispatchCount = 0;
  
  // Simulated render closure state
  // In React, this state remains false for the entire duration of the current render tick,
  // regardless of how many times setSubmitting(true) is invoked.
  const submittingState = false;
  
  // refs are mutated synchronously and are not bound to render closures
  const isSubmittingRef = { current: false };

  const onSubmit = async () => {
    dispatchCount++;
    await new Promise(resolve => setTimeout(resolve, 500));
  };

  const triggerClick = async () => {
    if (useRefLock) {
      if (isSubmittingRef.current) return;
      isSubmittingRef.current = true;
    } else {
      if (submittingState) return;
      // setSubmitting(true) scheduled, but submittingState remains false in this closure
    }

    try {
      await onSubmit();
    } finally {
      if (useRefLock) {
        isSubmittingRef.current = false;
      }
    }
  };

  // Simulate user double clicking rapidly in the same tick (render closure)
  triggerClick();
  triggerClick();

  return dispatchCount;
}

const originalCount = simulateSubmissions(false);
const fixedCount = simulateSubmissions(true);

printResult("Original (useState only) Dispatch Count", originalCount, 2);
printResult("Ref Lock (useRef) Dispatch Count", fixedCount, 1);

function printResult(label, val, expected) {
  console.log(`${label}: ${val} (Expected: ${expected}) -> ${val === expected ? "PASS" : "FAIL"}`);
}

if (originalCount === 2 && fixedCount === 1) {
  console.log("\nDouble-submit verification: SUCCESSFUL! useRef prevents duplicate dispatches.");
} else {
  console.error("\nDouble-submit verification: FAILED!");
  process.exit(1);
}
