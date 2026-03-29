import React from 'react';
import './AlgorithmCategoryPanel.css';

/**
 * Displays algorithm groups that are implemented in code and ready for integration.
 */
function AlgorithmCategoryPanel({ title, description, algorithms }) {
  return (
    <section className="algorithm-category-panel">
      <header className="algorithm-category-header">
        <h3 className="algorithm-category-title">{title}</h3>
        <p className="algorithm-category-description">{description}</p>
      </header>

      <div className="algorithm-category-body">
        {algorithms.map((algorithm) => (
          <article className="algorithm-category-item" key={algorithm.name}>
            <h4>{algorithm.name}</h4>
            <p>{algorithm.note}</p>
          </article>
        ))}
      </div>

      <footer className="algorithm-category-footer">
        Implemented in the algorithms module and ready for UI execution wiring.
      </footer>
    </section>
  );
}

export default AlgorithmCategoryPanel;
