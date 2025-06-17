import React from 'react';
import { withSearch } from "@elastic/react-search-ui";
import {
  Button,
  ButtonEnums,
} from '@ohif/ui';

function ClearFilters({ filters, clearFilters }) {
  return (
    <div>
      <Button
          type={ButtonEnums.type.primary}
          size={ButtonEnums.size.medium}
          onClick={() => clearFilters()}>
          Clear {filters.length} Filters
      </Button>
    </div>
  );
}

export default withSearch(({ filters, clearFilters }) => ({
  filters,
  clearFilters
}))(ClearFilters);
