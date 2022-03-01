/**
 *  Copyright (c) 2021 GraphQL Contributors.
 *
 *  This source code is licensed under the MIT license found in the
 *  LICENSE file in the root directory of this source tree.
 */

import React, { Component, FunctionComponent } from 'react';
import ReactDOM from 'react-dom';
import commonKeys from '../utility/commonKeys';
import { SizerComponent } from '../utility/CodeMirrorSizer';
import { ImagePreview as ImagePreviewComponent } from './ImagePreview';

import CM from 'codemirror';
import 'codemirror/addon/fold/foldgutter';
import 'codemirror/addon/fold/brace-fold';
import 'codemirror/addon/search/search';
import 'codemirror/addon/search/searchcursor';
import 'codemirror/addon/search/jump-to-line';
import 'codemirror/addon/dialog/dialog';
import 'codemirror-graphql/results/mode';
import 'codemirror/keymap/sublime';
import 'codemirror-graphql/utils/info-addon';

type ResultViewerProps = {
  value?: string;
  editorTheme?: string;
  ResultsTooltip?: typeof Component | FunctionComponent;
  ImagePreview: typeof ImagePreviewComponent;
  registerRef: (node: HTMLElement) => void;
};

/**
 * ResultViewer
 *
 * Maintains an instance of CodeMirror for viewing a GraphQL response.
 *
 * Props:
 *
 *   - value: The text of the editor.
 *
 */
export class ResultViewer extends React.Component<ResultViewerProps, {}>
  implements SizerComponent {
  viewer: (CM.Editor & { options: any }) | null = null;
  _node: HTMLElement | null = null;

  componentDidMount() {
    const CodeMirror = CM;

    const Tooltip = this.props.ResultsTooltip;
    const ImagePreview = this.props.ImagePreview;

    if (Tooltip || ImagePreview) {
      const tooltipDiv = document.createElement('div');
      CodeMirror.registerHelper(
        'info',
        'graphql-results',
        (token: any, _options: any, _cm: CodeMirror.Editor, pos: any) => {
          const infoElements: JSX.Element[] = [];
          if (Tooltip) {
            infoElements.push(<Tooltip pos={pos} />);
          }

          if (
            ImagePreview &&
            typeof ImagePreview.shouldRender === 'function' &&
            ImagePreview.shouldRender(token)
          ) {
            infoElements.push(<ImagePreview token={token} />);
          }

          if (!infoElements.length) {
            ReactDOM.unmountComponentAtNode(tooltipDiv);
            return null;
          }
          ReactDOM.render(<div>{infoElements}</div>, tooltipDiv);
          return tooltipDiv;
        },
      );
    }

    // @ts-expect-error
    this.viewer = codemirror(this._node, {
      lineWrapping: true,
      value: this.props.value || '',
      readOnly: true,
      theme: this.props.editorTheme || 'graphiql',
      mode: 'graphql-results',
      keyMap: 'sublime',
      foldGutter: {
        minFoldSize: 4,
      },
      gutters: ['CodeMirror-foldgutter'],
      info: Boolean(this.props.ResultsTooltip || this.props.ImagePreview),
      extraKeys: commonKeys,
    });
  }

  shouldComponentUpdate(nextProps: ResultViewerProps) {
    return this.props.value !== nextProps.value;
  }

  componentDidUpdate() {
    if (this.viewer) {
      this.viewer.setValue(this.props.value || '');
    }
  }

  componentWillUnmount() {
    this.viewer = null;
  }

  render() {
    return (
      <section
        className="result-window"
        aria-label="Result Window"
        aria-live="polite"
        aria-atomic="true"
        ref={node => {
          if (node) {
            this.props.registerRef(node);
            this._node = node;
          }
        }}
      />
    );
  }

  /**
   * Public API for retrieving the CodeMirror instance from this
   * React component.
   */
  getCodeMirror() {
    return this.viewer as CM.Editor;
  }

  /**
   * Public API for retrieving the DOM client height for this component.
   */
  getClientHeight() {
    return this._node && this._node.clientHeight;
  }
}
