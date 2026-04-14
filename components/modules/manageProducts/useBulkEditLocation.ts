import { useState, useMemo, useEffect } from "react";
import { UseFormReturn } from "react-hook-form";
import { GroupBase } from "react-select";
import { IOption } from "@/utils/types/common.types";
import {
  useAllCountries,
  useFetchStatesByCountry,
  useFetchCitiesByState,
} from "@/apis/queries/masters.queries";
import { useMe } from "@/apis/queries/user.queries";
import { BulkEditFormValues } from "./bulkEditTypes";

export function useBulkEditLocation(form: UseFormReturn<BulkEditFormValues>) {
  const countriesNewQuery = useAllCountries();
  const fetchStatesByCountry = useFetchStatesByCountry();
  const fetchCitiesByState = useFetchCitiesByState();
  const me = useMe();

  const [selectedCountries, setSelectedCountries] = useState<IOption[]>([]);
  const [selectedStates, setSelectedStates] = useState<IOption[]>([]);
  const [selectedCities, setSelectedCities] = useState<IOption[]>([]);
  const [statesByCountry, setStatesByCountry] = useState<Record<string, IOption[]>>({});
  const [citiesByState, setCitiesByState] = useState<Record<string, IOption[]>>({});

  const memoizedAllCountries = useMemo<IOption[]>(() => {
    if (!countriesNewQuery.data?.data) return [];
    return countriesNewQuery.data.data.map((country: any) => ({
      label: country.name,
      value: country.id.toString(),
    }));
  }, [countriesNewQuery.data]);

  const memoizedBranches = useMemo<IOption[]>(() => {
    if (!me.data?.data?.userBranch) return [];
    return me.data.data.userBranch.map((branch: any) => ({
      label: branch.city ? `${branch.city} Branch` : `Branch ${branch.id}`,
      value: branch.id.toString(),
    }));
  }, [me.data?.data?.userBranch]);

  const memoizedAllStates = useMemo<IOption[]>(() => {
    const allStates: IOption[] = [];
    Object.values(statesByCountry).forEach((states) => {
      allStates.push(...states);
    });
    return allStates;
  }, [statesByCountry]);

  const groupedStateOptions = useMemo<GroupBase<IOption>[]>(() =>
    selectedCountries
      .map((country) => ({
        label: country.label,
        options: statesByCountry[country.value] || [],
      }))
      .filter((group) => group.options.length > 0),
  [selectedCountries, statesByCountry]);

  const groupedCityOptions = useMemo<GroupBase<IOption>[]>(() =>
    selectedStates
      .map((state) => ({
        label: state.label,
        options: citiesByState[state.value] || [],
      }))
      .filter((group) => group.options.length > 0),
  [selectedStates, citiesByState]);

  // Fetch states when countries change
  useEffect(() => {
    if (selectedCountries.length > 0) {
      const fetchStates = async () => {
        const newStatesByCountry: Record<string, IOption[]> = {};
        for (const country of selectedCountries) {
          try {
            const response = await fetchStatesByCountry.mutateAsync({
              countryId: parseInt(country.value),
            });
            if (response?.data) {
              newStatesByCountry[country.value] = (response.data as any[]).map(
                (state: any) => ({ label: state.name, value: state.id.toString() }),
              );
            }
          } catch {
            // ignore per-country failures
          }
        }
        setStatesByCountry(newStatesByCountry);
      };
      fetchStates();
    } else {
      setStatesByCountry({});
      setSelectedStates([]);
      setSelectedCities([]);
    }
  }, [selectedCountries]); // eslint-disable-line react-hooks/exhaustive-deps

  // Fetch cities when states change
  useEffect(() => {
    if (selectedStates.length > 0) {
      const fetchCities = async () => {
        const newCitiesByState: Record<string, IOption[]> = {};
        for (const state of selectedStates) {
          try {
            const response = await fetchCitiesByState.mutateAsync({
              stateId: parseInt(state.value),
            });
            if (response?.data) {
              newCitiesByState[state.value] = (response.data as any[]).map(
                (city: any) => ({ label: city.name, value: city.id.toString() }),
              );
            }
          } catch {
            // ignore per-state failures
          }
        }
        setCitiesByState(newCitiesByState);
      };
      fetchCities();
    } else {
      setCitiesByState({});
      setSelectedCities([]);
    }
  }, [selectedStates]); // eslint-disable-line react-hooks/exhaustive-deps

  // Sync form → local state on mount
  useEffect(() => {
    const formValues = form.getValues();
    if (formValues.sellCountryIds?.length > 0) setSelectedCountries(formValues.sellCountryIds);
    if (formValues.sellStateIds?.length > 0) setSelectedStates(formValues.sellStateIds);
    if (formValues.sellCityIds?.length > 0) setSelectedCities(formValues.sellCityIds);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Sync local state → form
  useEffect(() => { form.setValue("sellStateIds", selectedStates); }, [selectedStates, form]);
  useEffect(() => { form.setValue("sellCityIds", selectedCities); }, [selectedCities, form]);

  return {
    selectedCountries,
    setSelectedCountries,
    selectedStates,
    setSelectedStates,
    selectedCities,
    setSelectedCities,
    statesByCountry,
    citiesByState,
    memoizedAllCountries,
    memoizedBranches,
    memoizedAllStates,
    groupedStateOptions,
    groupedCityOptions,
  };
}
