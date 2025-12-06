import React from 'react';
import { Badge } from 'react-bootstrap';
import { ReferralTreeNode } from '../../types';
import './ReferralTree.css';

interface ReferralTreeProps {
  tree: ReferralTreeNode;
}

const ReferralTree: React.FC<ReferralTreeProps> = ({ tree }) => {
  const renderNode = (node: ReferralTreeNode, level: number = 0): React.ReactNode => {
    const marginLeft = level * 30;
    const isRoot = level === 0;

    return (
      <div key={node.userId} className="tree-node" style={{ marginLeft: `${marginLeft}px` }}>
        <div className={`node-content ${isRoot ? 'root-node' : ''} ${!node.isActive ? 'inactive-node' : ''}`}>
          <div className="node-info">
            <strong>{node.username}</strong>
            <Badge bg={node.isActive ? 'success' : 'secondary'} className="ms-2">
              {node.isActive ? 'Active' : 'Inactive'}
            </Badge>
            <Badge bg="info" className="ms-2">
              Level {node.level}
            </Badge>
          </div>
          <div className="node-id">ID: {node.userId}</div>
        </div>
        {node.children && node.children.length > 0 && (
          <div className="tree-children">
            {node.children.map((child) => renderNode(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="referral-tree">
      <div className="tree-container">{renderNode(tree)}</div>
    </div>
  );
};

export default ReferralTree;

