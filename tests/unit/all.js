(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports", "./tasks/fixSourceMaps", "./tasks/installPeerDependencies", "./tasks/link", "./tasks/release", "./tasks/rename", "./tasks/repl", "./tasks/run", "./tasks/ts", "./tasks/typedoc", "./tasks/uploadCoverage", "./tasks/util/Publisher", "./lib/load-dojo-loader"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    require("./tasks/fixSourceMaps");
    require("./tasks/installPeerDependencies");
    require("./tasks/link");
    require("./tasks/release");
    require("./tasks/rename");
    require("./tasks/repl");
    require("./tasks/run");
    require("./tasks/ts");
    require("./tasks/typedoc");
    require("./tasks/uploadCoverage");
    require("./tasks/util/Publisher");
    require("./lib/load-dojo-loader");
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYWxsLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiYWxsLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7O0lBQUEsaUNBQStCO0lBQy9CLDJDQUF5QztJQUN6Qyx3QkFBc0I7SUFDdEIsMkJBQXlCO0lBQ3pCLDBCQUF3QjtJQUN4Qix3QkFBc0I7SUFDdEIsdUJBQXFCO0lBQ3JCLHNCQUFvQjtJQUNwQiwyQkFBeUI7SUFDekIsa0NBQWdDO0lBQ2hDLGtDQUFnQztJQUNoQyxrQ0FBZ0MiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgJy4vdGFza3MvZml4U291cmNlTWFwcyc7XG5pbXBvcnQgJy4vdGFza3MvaW5zdGFsbFBlZXJEZXBlbmRlbmNpZXMnO1xuaW1wb3J0ICcuL3Rhc2tzL2xpbmsnO1xuaW1wb3J0ICcuL3Rhc2tzL3JlbGVhc2UnO1xuaW1wb3J0ICcuL3Rhc2tzL3JlbmFtZSc7XG5pbXBvcnQgJy4vdGFza3MvcmVwbCc7XG5pbXBvcnQgJy4vdGFza3MvcnVuJztcbmltcG9ydCAnLi90YXNrcy90cyc7XG5pbXBvcnQgJy4vdGFza3MvdHlwZWRvYyc7XG5pbXBvcnQgJy4vdGFza3MvdXBsb2FkQ292ZXJhZ2UnO1xuaW1wb3J0ICcuL3Rhc2tzL3V0aWwvUHVibGlzaGVyJztcbmltcG9ydCAnLi9saWIvbG9hZC1kb2pvLWxvYWRlcic7XG4iXX0=