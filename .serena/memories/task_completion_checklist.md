# Task Completion Checklist

When completing any development task in this project, follow these steps:

## Code Quality Checks
- [ ] **Manual code review**: Check for syntax errors and logical issues
- [ ] **Browser console check**: Ensure no JavaScript errors in browser console
- [ ] **Cross-browser testing**: Test in Safari, Chrome, and Firefox (minimum)
- [ ] **Mobile responsiveness**: Verify layout works on mobile devices

## Functionality Testing
- [ ] **Game flow testing**: Complete full game from start to finish
- [ ] **IME compatibility**: Test Japanese input and context recognition (on Japanese system)
- [ ] **LocalStorage**: Verify rankings save and load correctly
- [ ] **Demo page**: Test "good feeling conversion" functionality if affected
- [ ] **Navigation**: Check all buttons and links work correctly

## Content & Localization
- [ ] **Japanese text accuracy**: Verify all Japanese text is correct
- [ ] **Question data**: Validate questions.json format if modified
- [ ] **UI text consistency**: Check all interface text is appropriate

## Performance & Accessibility
- [ ] **Page load speed**: Ensure fast loading (no heavy assets)
- [ ] **Accessibility**: Basic keyboard navigation and screen reader compatibility
- [ ] **Image optimization**: Compress any new images added

## Git & Deployment
- [ ] **Commit message**: Write clear, descriptive commit message in English
- [ ] **File staging**: Only commit necessary files (no build artifacts or system files)
- [ ] **GitHub Pages**: Verify deployment works correctly after push to main

## No Automated Tools Available
Since this project has no build tools or CI/CD:
- **No linting command** - manual code review required
- **No automated testing** - manual browser testing required
- **No type checking** - careful JavaScript coding required
- **No formatting command** - maintain consistent manual formatting

## Documentation
- [ ] **Update README.md**: If feature changes affect user-facing functionality
- [ ] **Update specification.md**: If game logic or UI significantly changes
- [ ] **Comment complex code**: Add comments for non-obvious logic