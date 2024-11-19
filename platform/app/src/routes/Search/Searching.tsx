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
  index: "studies",
  apiKey: "SHlxdzRwSUJITEdvSlBXeUFzZFA6aFkzYkRWTDVSMDY0cmdKU2U4am5mUQ=="
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
    resultsPerPage: 25
  },
  apiConnector: connector,
  alwaysSearchOnInitialLoad: true
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
    <div className="bg-black text-blue-300">
      {/* <Header /> */}
      <Layout
        header={
          <SearchBox
          autocompleteSuggestions={true}
          inputView={({ getAutocomplete, getInputProps, getButtonProps }) => (
            <>
              <div className="">
                <input {...getInputProps({ placeholder: 'Search games' })} />
                {getAutocomplete()}
              </div>
              <button {...getButtonProps()}>
                <svg viewBox="0 0 250 250" width="20" height="20" role="img">
                  <title>Search</title>
                  <path d="M244.186 214.604l-54.379-54.378c-.289-.289-.628-.491-.93-.76 10.7-16.231 16.945-35.66 16.945-56.554C205.822 46.075 159.747 0 102.911 0S0 46.075 0 102.911c0 56.835 46.074 102.911 102.91 102.911 20.895 0 40.323-6.245 56.554-16.945.269.301.47.64.759.929l54.38 54.38c8.169 8.168 21.413 8.168 29.583 0 8.168-8.169 8.168-21.413 0-29.582zm-141.275-44.458c-37.134 0-67.236-30.102-67.236-67.235 0-37.134 30.103-67.236 67.236-67.236 37.132 0 67.235 30.103 67.235 67.236s-30.103 67.235-67.235 67.235z" />
                </svg>
              </button>
            </>
          )}
        />
        }
        sideContent={
          <div>
            <Filtering />
          </div>}
        bodyHeader={<Showing />}
        bodyContent={<Results resultView={CustomResultView} shouldTrackClickThrough={true}  />}
        bodyFooter={<Paging />}
      />
      {/* <Footer /> */}
      </div>
    </SearchProvider>

  );
}

export default Searching;
