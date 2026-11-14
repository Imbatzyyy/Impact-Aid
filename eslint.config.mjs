import tseslint from 'typescript-eslint';
import angular from 'angular-eslint';
export default tseslint.config({ignores:['**/*.spec.ts']},{
 files:['src/**/*.ts'],extends:[...tseslint.configs.recommended],processor:angular.processInlineTemplates,
 rules:{'@typescript-eslint/no-explicit-any':'off','@typescript-eslint/no-unused-vars':'off','@typescript-eslint/no-unused-expressions':['error',{allowShortCircuit:true,allowTernary:true}]}
});
