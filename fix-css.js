const fs = require('fs');
let content = fs.readFileSync('src/app/taskrow/projects.module.css', 'utf16le'); // The echo >> created utf16le
if (!content.includes('.errorMessage')) {
   content = fs.readFileSync('src/app/taskrow/projects.module.css', 'utf8');
}
const index = content.indexOf('.errorMessage');
const cleanContent = content.substring(0, index) + `.errorMessage {
  background-color: rgba(239, 68, 68, 0.1);
  color: var(--status-error);
  padding: 12px 16px;
  border-radius: var(--radius-md);
  margin-bottom: 24px;
  border: 1px solid rgba(239, 68, 68, 0.2);
  font-size: 0.875rem;
}

.approveBtn {
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--status-success, #10b981);
  color: #fff;
  border: none;
  padding: 4px 8px;
  border-radius: var(--radius-sm, 4px);
  font-size: 0.75rem;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s ease;
  margin-right: 8px;
}
.approveBtn:hover {
  background-color: #059669;
}
`;
// Ensure we write back as UTF-8
const buffer = Buffer.from(cleanContent.replace(/\0/g, ''), 'utf8');
fs.writeFileSync('src/app/taskrow/projects.module.css', buffer);
console.log('CSS limpo com sucesso.');
