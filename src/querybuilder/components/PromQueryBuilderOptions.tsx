import React from 'react';

import { CoreApp, SelectableValue } from '@grafana/data';
import { RadioButtonGroup, Select } from '@grafana/ui';

import { getQueryTypeChangeHandler, getQueryTypeOptions } from '../../components/PromExploreExtraField';
import { FORMAT_OPTIONS, INTERVAL_FACTOR_OPTIONS } from '../../components/PromQueryEditor';
import { EditorField, EditorRow } from '../../components/QueryEditor';
import { AutoSizeInput } from "../../components/QueryEditor/AutoSizeInput";
import { PromQuery } from '../../types';
import { QueryOptionGroup } from '../shared/QueryOptionGroup';

import { getLegendModeLabel, PromQueryLegendEditor } from './PromQueryLegendEditor';

export interface Props {
  query: PromQuery;
  app?: CoreApp;
  onChange: (update: PromQuery) => void;
  onRunQuery: () => void;
}

export const PromQueryBuilderOptions = React.memo<Props>(({ query, app, onChange, onRunQuery }) => {
  const onChangeFormat = (value: SelectableValue<string>) => {
    onChange({ ...query, format: value.value });
    onRunQuery();
  };

  const onChangeStep = (evt: React.FormEvent<HTMLInputElement>) => {
    onChange({ ...query, interval: evt.currentTarget.value });
    onRunQuery();
  };

  const queryTypeOptions = getQueryTypeOptions(app === CoreApp.Explore || app === CoreApp.PanelEditor);
  const onQueryTypeChange = getQueryTypeChangeHandler(query, onChange);

  const onIntervalFactorChange = (value: SelectableValue<number>) => {
    onChange({ ...query, intervalFactor: value.value });
    onRunQuery();
  };

  const formatOption = FORMAT_OPTIONS.find((option) => option.value === query.format) || FORMAT_OPTIONS[0];
  const queryTypeValue = getQueryTypeValue(query);
  const queryTypeLabel = queryTypeOptions.find((x) => x.value === queryTypeValue)!.label;

  return (
    <EditorRow>
      <QueryOptionGroup
        title="Options"
        collapsedInfo={getCollapsedInfo(query, formatOption.label!, queryTypeLabel)}
      >
        <PromQueryLegendEditor
          legendFormat={query.legendFormat}
          onChange={(legendFormat) => onChange({ ...query, legendFormat })}
          onRunQuery={onRunQuery}
        />
        <EditorField
          label="Min step"
          tooltip={
            <>
              An additional lower limit for the step parameter of the Prometheus query and for the{' '}
              <code>$__interval</code> and <code>$__rate_interval</code> variables.
            </>
          }
        >
          <AutoSizeInput
            type="text"
            aria-label="Set lower limit for the step parameter"
            placeholder={'auto'}
            minWidth={10}
            onCommitChange={onChangeStep}
            defaultValue={query.interval}
          />
        </EditorField>
        <EditorField label="Format">
          <Select value={formatOption} allowCustomValue onChange={onChangeFormat} options={FORMAT_OPTIONS} />
        </EditorField>
        <EditorField label="Type">
          <RadioButtonGroup options={queryTypeOptions} value={queryTypeValue} onChange={onQueryTypeChange} />
        </EditorField>
        {query.intervalFactor && query.intervalFactor > 1 && (
          <EditorField label="Resolution">
            <Select
              aria-label="Select resolution"
              isSearchable={false}
              options={INTERVAL_FACTOR_OPTIONS}
              onChange={onIntervalFactorChange}
              value={INTERVAL_FACTOR_OPTIONS.find((option) => option.value === query.intervalFactor)}
            />
          </EditorField>
        )}
      </QueryOptionGroup>
    </EditorRow>
  );
});

function getQueryTypeValue(query: PromQuery) {
  return query.range && query.instant ? 'both' : query.instant ? 'instant' : 'range';
}

function getCollapsedInfo(query: PromQuery, formatOption: string, queryType: string): string[] {
  const items: string[] = [];

  items.push(`Legend: ${getLegendModeLabel(query.legendFormat)}`);
  items.push(`Format: ${formatOption}`);
  items.push(`Step: ${query.interval ?? 'auto'}`);
  items.push(`Type: ${queryType}`);
  return items;
}

PromQueryBuilderOptions.displayName = 'PromQueryBuilderOptions';
