import React from 'react';
import { SearchProvider, Results, Paging, SearchBox } from '@elastic/react-search-ui';
import { SearchResult } from "@elastic/search-ui";
import ElasticsearchAPIConnector from "@elastic/search-ui-elasticsearch-connector";
import { Layout } from '@elastic/react-search-ui-views';
import "@elastic/react-search-ui-views/lib/styles/styles.css";
import moment from "moment";
import Header from './Header';
import Footer from './Footer';
import { Filtering, Showing } from './Sider';
import { title } from 'process';


const connector = new ElasticsearchAPIConnector({
  host: "http://localhost:9200",
  index: "study",
  apiKey: "ZWxhc3RpYzplbGFzdGlj"
});

const configurationOptions = {
  debug: true,
  searchQuery: {
    search_fields: {
      StudyDescription: {},
      title: {weight: 3}
    },
    result_fields: {
      title:{
        raw:{}
      },
      StudyDescription:{
        raw: {}
      },
      StudyInstanceUID: {
        raw: {}
      },
      StudyDate:{ raw:{}}
    },
    disjunctiveFacets: ["PatientSex", "StudyDate"],
    facets: {
      PatientSex: {type: "value"},
      StudyDate: {
        type: "range",
        ranges: [
          {
            from: moment().subtract(1, 'days').format('YYYY-MM-DD'),
            to: moment().format('YYYY-MM-DD'),
            name: "Within the last 1 day"
          },
          {
            from: moment().subtract(1, 'weeks').format('YYYY-MM-DD'),
            to: moment().subtract(1, 'days').format('YYYY-MM-DD'),
            name: "Within the last 1 week"
          },
          {
            from: moment().subtract(1, 'months').format('YYYY-MM-DD'),
            to: moment().subtract(1, 'weeks').format('YYYY-MM-DD'),
            name: "Winthin the last 1 month"
          },
          {
            to: moment().subtract(1, 'months').format('YYYY-MM-DD'),
            name: "More than 1 month ago"
          }
        ]
      }
    }
  },
  autocompleteQuery: {
    suggestions: {
      types: {
        "documents": { fields: ["title.suggest"] }
      },
      size: 4
    }
  },
  initialState: {
    resultsPerPage: 10,
    filters: [],
  },
  apiConnector: connector,
  alwaysSearchOnInitialLoad: true,
  initializeWithDefaultFilters: true,
};

const CustomResultView = ({ result, onClickLink}: {
  result: SearchResult,
  onClickLink: () => void
})=> (
  <li className="sui-result">
    <div className="sui-result__header">
      <h3>
        {/* Maintain onClickLink to correct track click throughs for analytics*/}
        <a onClick={onClickLink} href={`http://localhost:3000/viewer?StudyInstanceUIDs=${encodeURIComponent(result.StudyInstanceUID.raw)}`}>
          {result.title.raw}
        </a>
      </h3>
    </div>
    <div className="sui-result__body">
      {/* use 'raw' values of fields to access values without snippets */}
      <div className="sui-result__details">
        <p>{result.StudyDescription.raw} </p>
        <p>{result.StudyInstanceUID.raw} </p>
      </div>
    </div>
  </li>
);

function Searching({
  data: studies,
  dataTotal: studiesTotal,
  isLoadingData,
  dataSource,
  hotkeysManager,
  dataPath,
  onRefresh,
  servicesManager,
}: withAppTypes) {
  const { hotkeyDefinitions, hotkeyDefaults } = hotkeysManager;


  return (

    <SearchProvider config={configurationOptions}>
     <ErrorBoundary>
      {/* <Header /> */}
      <Layout
        header={
          <SearchBox
            debounceLength={300}
            autocompleteSuggestions={true}
            inputView={({ getAutocomplete, getInputProps, getButtonProps }) => (
            <>
                <div className="sui-search-box__wrapper">
                  <input {...getInputProps({ placeholder: 'Search patients by the first letter of the name' })} />
                  {getAutocomplete()}
                </div>
                <input
                  type="submit"
                  className="button sui-search-box__submit"
                  value="Search"
                />
            </>
          )}
        />
        }
        sideContent={<Filtering />}
        bodyHeader={<Showing />}
        bodyContent={<Results resultView={CustomResultView} shouldTrackClickThrough={true}  />}
        bodyFooter={<Paging />}
      />
      {/* <Footer /> */}
     </ErrorBoundary>
    </SearchProvider>

  );
}

export default Searching;
