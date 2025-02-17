import React from 'react';
import {
  Facet,
  Sorting,
  PagingInfo,
  ResultsPerPage,
} from '@elastic/react-search-ui';

// This is a custom component we've created.
import ClearFilters from "./ClearFilters";

/**
 * Sidebar - search + filters
 */
const Filtering = () => (
  <>
    <Sorting
      label={'Sort by'}
      sortOptions={[
        {
          name: 'Relevance',
          value: '',
          direction: '',
        },
        {
          name: "Date (newest)",
          value: [
            {
              field: "StudyDate",
              direction: "desc"
            }
          ]
        },
        {
          name: "Date (oldest)",
          value: [
            {
              field: "StudyDate",
              direction: "asc"
            }
          ]
        },
      ]}
    />
    <ClearFilters />
    <Facet field="PatientSex" label="Sex" filterType="any" />
    <Facet field="StudyDate" label="Date" filterType="any" />
    <Facet
      field="studio"
      label="Game Studio"
      isFilterable={true}
      filterType="any"
    />
  </>
);

/**
 * Results header - showing per page + sorting
 */
const Showing = () => (
  <>
    <PagingInfo />
    <ResultsPerPage options={[10, 25, 50]} />

  </>
);

export { Filtering, Showing };
