﻿using JayData.Test.CommonItems.Entities;
using JayData.Test.WebApi_2_2_OData_4.Model;
using System;
using System.Collections.Generic;
using System.Data.Entity;
using System.Data.Entity.Infrastructure;
using System.Linq;
using System.Net;
using System.Text;
using System.Threading.Tasks;
using System.Web.Http;
using System.Web.OData;

namespace WebApi_2_2_OData_4.Controllers
{
    public class ArticlesController : ODataController
    {
        NewsReaderContext db = new NewsReaderContext();

        [EnableQuery]
        public IQueryable<Article> Get()
        {
            return db.Articles;
        }

        [EnableQuery]
        public SingleResult<Article> Get([FromODataUri] int key)
        {
            IQueryable<Article> result = db.Articles.Where(p => p.Id == key);
            return SingleResult.Create(result);
        }

        public async Task<IHttpActionResult> Post(Article Article)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }
            db.Articles.Add(Article);
            await db.SaveChangesAsync();
            return Created(Article);
        }

        public async Task<IHttpActionResult> Patch([FromODataUri] int key, Delta<Article> Article)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }
            var entity = await db.Articles.FindAsync(key);
            if (entity == null)
            {
                return NotFound();
            }
            Article.Patch(entity);
            try
            {
                await db.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!ProductExists(key))
                {
                    return NotFound();
                }
                else
                {
                    throw;
                }
            }
            return Updated(entity);
        }
        
        public async Task<IHttpActionResult> Put([FromODataUri] int key, Article update)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }
            if (key != update.Id)
            {
                return BadRequest();
            }
            db.Entry(update).State = EntityState.Modified;
            try
            {
                await db.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!ProductExists(key))
                {
                    return NotFound();
                }
                else
                {
                    throw;
                }
            }
            return Updated(update);
        }
        
        public async Task<IHttpActionResult> Delete([FromODataUri] int key)
        {
            var Article = await db.Articles.FindAsync(key);
            if (Article == null)
            {
                return NotFound();
            }
            db.Articles.Remove(Article);
            await db.SaveChangesAsync();
            return StatusCode(HttpStatusCode.NoContent);
        }

        [EnableQuery]
        public SingleResult<Category> GetCategory([FromODataUri] int key)
        {
            return SingleResult.Create( db.Articles.Where(a => a.Id == key).Select(a=>a.Category));
        }

        //public string GetTitle([FromODataUri] int key) {
        //    return "ArtTitle";
        //}

        public string GetTitleFromCategories([FromODataUri] int key)
        {
            return "catTitle";
        }

        private bool ProductExists(int key)
        {
            return db.Articles.Any(p => p.Id == key);
        }
        protected override void Dispose(bool disposing)
        {
            db.Dispose();
            base.Dispose(disposing);
        }
    }
}
