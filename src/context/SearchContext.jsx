import { createContext, useState } from 'react';

export const SearchContext = createContext();

export const SearchProvider = ({ children }) => {
  // PNR Status state
  const [pnrContextState, setPnrContextState] = useState({
    pnrArray: Array(10).fill(""),
    pnrData: null,
  });

  // Train In Between state
  const [tibContextState, setTibContextState] = useState({
    from: "",
    to: "",
    trains: null,
  });

  // Train Details state
  // We initialize the date exactly how the component does, but since Date objects are
  // mutable and evaluated on mount, we'll initialize it to null and let the component handle it if null,
  // or we can store simple strings. Let's store date as null initially.
  const [tdContextState, setTdContextState] = useState({
    trainNo: "",
    date: null,
    liveData: null,
  });

  return (
    <SearchContext.Provider
      value={{
        pnrContextState,
        setPnrContextState,
        tibContextState,
        setTibContextState,
        tdContextState,
        setTdContextState,
      }}
    >
      {children}
    </SearchContext.Provider>
  );
};
