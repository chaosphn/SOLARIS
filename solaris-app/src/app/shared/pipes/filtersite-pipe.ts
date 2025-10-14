import { Pipe, PipeTransform } from '@angular/core';
import { SiteModel } from '../models/config.model';

@Pipe({
  name: 'filtersite',
  standalone: false
})
export class FiltersitePipe implements PipeTransform {

  transform(sites: SiteModel[], searchText: string): SiteModel[] {

    //console.log(sites, searchText)
    if (!sites || !searchText) {
      return sites;
    }
    
    const filteredSites = sites.filter(site => 
      site.name.toUpperCase().includes(searchText.toUpperCase())
    );
    
    return filteredSites.sort((a, b) => 
      a.id.toUpperCase().localeCompare(b.id.toUpperCase())
    );
  }

}
