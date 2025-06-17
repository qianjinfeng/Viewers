import React from 'react';
import {
  useSearch,
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
const Filtering = () => {
  const { wasSearched } = useSearch();
  return (
   <div>
    {wasSearched && ( <Sorting
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
    />)}
    <ClearFilters />
    <Facet field="PatientSex" label="Sex" filterType="any" />
    <Facet field="StudyDate" label="Date" filterType="any" />
   </div>
  )
};

/**
 * Results header - showing per page + sorting
 */
const Showing = () => {
  const { wasSearched } = useSearch();
  return (
   <>
    {wasSearched && <PagingInfo />}
    {wasSearched && <ResultsPerPage options={[10, 25, 50]} />}
   </>
  )
};

export { Filtering, Showing };
