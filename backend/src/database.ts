import sqlite3 from 'sqlite3';
import path, { resolve } from 'path';
import { Article, Author, Draft } from './types';
import { calculatePopularityScore } from './popularityScorer';

class Database {
  private db: sqlite3.Database;

  constructor() {
    const dbPath = path.join(__dirname, '../penny.db');
    this.db = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        console.error('Error opening database:', err);
      } else {
        console.log('Connected to SQLite database');
        this.initializeTables();
      }
    });
  }

  private initializeTables(): void {
    // Create authors table
    this.db.run(`
      CREATE TABLE IF NOT EXISTS authors (
        address TEXT PRIMARY KEY,
        displayName TEXT,
        createdAt TEXT NOT NULL,
        totalEarnings REAL DEFAULT 0,
        totalArticles INTEGER DEFAULT 0,
        totalViews INTEGER DEFAULT 0,
        totalPurchases INTEGER DEFAULT 0
      )
    `);

    // Create articles table
    this.db.run(`
      CREATE TABLE IF NOT EXISTS articles (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        preview TEXT NOT NULL,
        price REAL NOT NULL,
        authorAddress TEXT NOT NULL,
        publishDate TEXT NOT NULL,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL,
        views INTEGER DEFAULT 0,
        purchases INTEGER DEFAULT 0,
        earnings REAL DEFAULT 0,
        readTime TEXT NOT NULL,
        categories TEXT DEFAULT '[]',
        FOREIGN KEY (authorAddress) REFERENCES authors (address)
      )
    `);

    // Create drafts table
    this.db.run(`
      CREATE TABLE IF NOT EXISTS drafts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        price REAL NOT NULL,
        authorAddress TEXT NOT NULL,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL,
        expiresAt TEXT NOT NULL,
        FOREIGN KEY (authorAddress) REFERENCES authors (address)
      )
    `);

    // Create user_likes table to track likes and prevent duplicates
    this.db.run(`
      CREATE TABLE IF NOT EXISTS user_likes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        articleId INTEGER NOT NULL,
        userAddress TEXT NOT NULL,
        createdAt TEXT NOT NULL,
        FOREIGN KEY (articleId) REFERENCES articles (id) ON DELETE CASCADE,
        UNIQUE(articleId, userAddress)
      )
    `);

    console.log('Database tables initialized');
    this.migrateTables();
  }

  private migrateTables(): void {
    // Add categories column to existing articles table if it doesn't exist
    this.db.run(`
      ALTER TABLE articles ADD COLUMN categories TEXT DEFAULT '[]'
    `, (err) => {
      if (err && !err.message.includes('duplicate column name')) {
        console.error('Error adding categories column:', err);
      } else if (!err) {
        console.log('Added categories column to articles table');
      }
    });

    // Add likes column to existing articles table if it doesn't exist
    this.db.run(`
      ALTER TABLE articles ADD COLUMN likes INTEGER DEFAULT 0
    `, (err) => {
      if (err && !err.message.includes('duplicate column name')) {
        console.error('Error adding likes column:', err);
      } else if (!err) {
        console.log('Added likes column to articles table');
      }
    });

    // Add popularityScore column to existing articles table if it doesn't exist
    this.db.run(`
      ALTER TABLE articles ADD COLUMN popularityScore REAL DEFAULT 0
    `, (err) => {
      if (err && !err.message.includes('duplicate column name')) {
        console.error('Error adding popularityScore column:', err);
      } else if (!err) {
        console.log('Added popularityScore column to articles table');
      }
    });

    // Create index for popularityScore for better sorting performance
    this.db.run(`
      CREATE INDEX IF NOT EXISTS idx_articles_popularity
      ON articles(popularityScore DESC)
    `, (err) => {
      if (err) {
        console.error('Error creating popularity index:', err);
      } else {
        console.log('Created popularity score index');
      }
    });
  }

  // Helper method to parse article from database row
  private parseArticleFromRow(row: any): Article {
    return {
      ...row,
      categories: row.categories ? JSON.parse(row.categories) : []
    };
  }

  // Article methods
  createArticle(article: Omit<Article, 'id'>): Promise<Article> {
    return new Promise((resolve, reject) => {
      const {
        title,
        content,
        preview,
        price,
        authorAddress,
        publishDate,
        createdAt,
        updatedAt,
        views,
        purchases,
        earnings,
        readTime,
        categories
      } = article;

      const categoriesJson = JSON.stringify(categories || []);

      this.db.run(
        `INSERT INTO articles (title, content, preview, price, authorAddress, publishDate, createdAt, updatedAt, views, purchases, earnings, readTime, categories)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [title, content, preview, price, authorAddress, publishDate, createdAt, updatedAt, views, purchases, earnings, readTime, categoriesJson],
        function(err) {
          if (err) {
            reject(err);
          } else {
            resolve({ id: this.lastID, ...article } as Article);
          }
        }
      );
    });
  }

  getArticlesByAuthor(authorAddress: string): Promise<Article[]> {
    return new Promise((resolve, reject) => {
      this.db.all(
        'SELECT * FROM articles WHERE authorAddress = ? ORDER BY createdAt DESC',
        [authorAddress],
        (err, rows) => {
          if (err) {
            reject(err);
          } else {
            const articles = rows.map(row => this.parseArticleFromRow(row));
            resolve(articles);
          }
        }
      );
    });
  }

  getArticleById(id: number): Promise<Article | null> {
    return new Promise((resolve, reject) => {
      this.db.get(
        'SELECT * FROM articles WHERE id = ?',
        [id],
        (err, row) => {
          if (err) {
            reject(err);
          } else {
            resolve(row ? this.parseArticleFromRow(row) : null);
          }
        }
      );
    });
  }

  getAllArticles(): Promise<Article[]> {
    return new Promise((resolve, reject) => {
      this.db.all(
        'SELECT * FROM articles ORDER BY createdAt DESC',
        (err, rows) => {
          if (err) {
            reject(err);
          } else {
            const articles = rows.map(row => this.parseArticleFromRow(row));
            resolve(articles);
          }
        }
      );
    });
  }

  // Author methods
  createOrUpdateAuthor(author: Author): Promise<Author> {
    return new Promise((resolve, reject) => {
      const { address, displayName, createdAt, totalEarnings, totalArticles, totalViews, totalPurchases } = author;

      this.db.run(
        `INSERT OR REPLACE INTO authors (address, displayName, createdAt, totalEarnings, totalArticles, totalViews, totalPurchases)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [address, displayName, createdAt, totalEarnings, totalArticles, totalViews, totalPurchases],
        function(err) {
          if (err) {
            reject(err);
          } else {
            resolve(author);
          }
        }
      );
    });
  }

  getAuthor(address: string): Promise<Author | null> {
    return new Promise((resolve, reject) => {
      this.db.get(
        'SELECT * FROM authors WHERE address = ?',
        [address],
        (err, row) => {
          if (err) {
            reject(err);
          } else {
            resolve((row as Author) || null);
          }
        }
      );
    });
  }

  updateArticleStats(id: number, views?: number, purchases?: number, earnings?: number): Promise<void> {
    return new Promise((resolve, reject) => {
      let query = 'UPDATE articles SET ';
      const params: any[] = [];
      const updates: string[] = [];

      if (views !== undefined) {
        updates.push('views = ?');
        params.push(views);
      }
      if (purchases !== undefined) {
        updates.push('purchases = ?');
        params.push(purchases);
      }
      if (earnings !== undefined) {
        updates.push('earnings = ?');
        params.push(earnings);
      }

      query += updates.join(', ') + ' WHERE id = ?';
      params.push(id);

      this.db.run(query, params, (err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }

  // Increment article views by 1
  incrementArticleViews(articleId: number): Promise<boolean> {
    return new Promise((resolve, reject) => {
      const query = 'UPDATE articles SET views = views + 1 WHERE id = ?';
      
      this.db.run(query, [articleId], function(err) {
        if (err) {
          console.error('Error incrementing article views:', err);
          reject(err);
          return;
        }
        
        // this.changes tells us how many rows were affected
        resolve(this.changes > 0);
      });
    });
  }

  // Draft methods
  createDraft(draft: Omit<Draft, 'id'>): Promise<Draft> {
    return new Promise((resolve, reject) => {
      const { title, content, price, authorAddress, createdAt, updatedAt, expiresAt } = draft;

      // Always create new draft
      this.db.run(
        `INSERT INTO drafts (title, content, price, authorAddress, createdAt, updatedAt, expiresAt)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [title, content, price, authorAddress, createdAt, updatedAt, expiresAt],
        function(err) {
          if (err) {
            reject(err);
          } else {
            resolve({ id: this.lastID, ...draft } as Draft);
          }
        }
      );
    });
  }

  updateDraft(draftId: number, draft: Omit<Draft, 'id'>): Promise<Draft> {
    return new Promise((resolve, reject) => {
      const { title, content, price, authorAddress, updatedAt, expiresAt } = draft;

      this.db.run(
        `UPDATE drafts SET title = ?, content = ?, price = ?, updatedAt = ?, expiresAt = ? WHERE id = ? AND authorAddress = ?`,
        [title, content, price, updatedAt, expiresAt, draftId, authorAddress],
        function(err) {
          if (err) {
            reject(err);
          } else if (this.changes === 0) {
            reject(new Error('Draft not found or unauthorized'));
          } else {
            resolve({ id: draftId, ...draft } as Draft);
          }
        }
      );
    });
  }

  createOrUpdateRecentDraft(draft: Omit<Draft, 'id'>, isAutoSave: boolean = false): Promise<Draft> {
    return new Promise((resolve, reject) => {
      const { title, content, price, authorAddress, createdAt, updatedAt, expiresAt } = draft;

      if (!isAutoSave) {
        // Manual save: always create new draft
        return this.createDraft(draft).then(resolve).catch(reject);
      }

      // Auto-save: check for recent draft (within 1 hour)
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
      
      this.db.get(
        'SELECT id FROM drafts WHERE authorAddress = ? AND updatedAt > ? ORDER BY updatedAt DESC LIMIT 1',
        [authorAddress, oneHourAgo],
        (err, row: any) => {
          if (err) {
            reject(err);
            return;
          }

          if (row) {
            // Update recent draft
            this.db.run(
              `UPDATE drafts SET title = ?, content = ?, price = ?, updatedAt = ?, expiresAt = ? WHERE id = ?`,
              [title, content, price, updatedAt, expiresAt, row.id],
              function(err) {
                if (err) {
                  reject(err);
                } else {
                  resolve({ id: row.id, ...draft } as Draft);
                }
              }
            );
          } else {
            // Create new draft
            this.createDraft(draft).then(resolve).catch(reject);
          }
        }
      );
    });
  }

  getDraftsByAuthor(authorAddress: string): Promise<Draft[]> {
    return new Promise((resolve, reject) => {
      this.db.all(
        'SELECT * FROM drafts WHERE authorAddress = ? AND expiresAt > datetime("now") ORDER BY updatedAt DESC',
        [authorAddress],
        (err, rows) => {
          if (err) {
            reject(err);
          } else {
            resolve(rows as Draft[]);
          }
        }
      );
    });
  }

  deleteDraft(draftId: number, authorAddress: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
      this.db.run(
        'DELETE FROM drafts WHERE id = ? AND authorAddress = ?',
        [draftId, authorAddress],
        function(err) {
          if (err) {
            reject(err);
          } else {
            resolve(this.changes > 0);
          }
        }
      );
    });
  }

  cleanupExpiredDrafts(): Promise<number> {
    return new Promise((resolve, reject) => {
      this.db.run(
        'DELETE FROM drafts WHERE expiresAt <= datetime("now")',
        function(err) {
          if (err) {
            reject(err);
          } else {
            resolve(this.changes);
          }
        }
      );
    });
  }

  // Update article
  updateArticle(id: number, updates: { title?: string; content?: string; preview?: string; price?: number; readTime?: string; updatedAt?: string; categories?: string[] }): Promise<Article> {
    return new Promise((resolve, reject) => {
      const fields: string[] = [];
      const values: any[] = [];

      Object.entries(updates).forEach(([key, value]) => {
        if (value !== undefined) {
          if (key === 'categories') {
            fields.push(`${key} = ?`);
            values.push(JSON.stringify(value));
          } else {
            fields.push(`${key} = ?`);
            values.push(value);
          }
        }
      });

      if (fields.length === 0) {
        reject(new Error('No fields to update'));
        return;
      }

      values.push(id);
      const query = `UPDATE articles SET ${fields.join(', ')} WHERE id = ?`;

      this.db.run(query, values, function(err) {
        if (err) {
          reject(err);
        } else if (this.changes === 0) {
          reject(new Error('Article not found'));
        } else {
          // Fetch and return updated article - the promise chain will handle this
          resolve(undefined);
        }
      });
    }).then(() => this.getArticleById(id)) as Promise<Article>;
  }

  // Delete article
  deleteArticle(id: number): Promise<boolean> {
    return new Promise((resolve, reject) => {
      this.db.run(
        'DELETE FROM articles WHERE id = ?',
        [id],
        function(err) {
          if (err) {
            reject(err);
          } else {
            resolve(this.changes > 0);
          }
        }
      );
    });
  }

  // Recalculate author totals from existing articles (for data correction)
  recalculateAuthorTotals(authorAddress: string): Promise<void> {
    return new Promise((resolve, reject) => {
      // Get current totals from articles
      this.db.get(
        `SELECT 
          COUNT(*) as articleCount,
          COALESCE(SUM(views), 0) as totalViews,
          COALESCE(SUM(purchases), 0) as totalPurchases,
          COALESCE(SUM(earnings), 0) as totalEarnings
         FROM articles WHERE authorAddress = ?`,
        [authorAddress],
        async (err, row: any) => {
          if (err) {
            reject(err);
            return;
          }

          try {
            // Get existing author record
            const author = await this.getAuthor(authorAddress);
            if (author) {
              // Update with recalculated totals, but preserve totalArticles if it's higher
              // (to account for deleted articles that should count toward lifetime total)
              author.totalViews = Math.max(row.totalViews, 0);
              author.totalPurchases = Math.max(row.totalPurchases, 0);
              author.totalEarnings = Math.max(row.totalEarnings, 0);
              author.totalArticles = Math.max(author.totalArticles, row.articleCount);
              
              await this.createOrUpdateAuthor(author);
            }
            resolve();
          } catch (error) {
            reject(error);
          }
        }
      );
    });
  }

  // Like/Unlike methods
  likeArticle(articleId: number, userAddress: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
      const now = new Date().toISOString();
      
      // Try to insert like (will fail if duplicate due to UNIQUE constraint)
      this.db.run(
        'INSERT INTO user_likes (articleId, userAddress, createdAt) VALUES (?, ?, ?)',
        [articleId, userAddress, now],
        function(err) {
          if (err) {
            if (err.message.includes('UNIQUE constraint failed')) {
              // User already liked this article
              resolve(false);
            } else {
              reject(err);
            }
            return;
          }
          
          // Successfully added like, now increment article likes count
          resolve(true);
        }
      );
    });
  }

  unlikeArticle(articleId: number, userAddress: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
      this.db.run(
        'DELETE FROM user_likes WHERE articleId = ? AND userAddress = ?',
        [articleId, userAddress],
        function(err) {
          if (err) {
            reject(err);
            return;
          }
          
          // this.changes tells us how many rows were affected
          resolve(this.changes > 0);
        }
      );
    });
  }

  checkUserLikedArticle(articleId: number, userAddress: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
      this.db.get(
        'SELECT 1 FROM user_likes WHERE articleId = ? AND userAddress = ?',
        [articleId, userAddress],
        (err, row) => {
          if (err) {
            reject(err);
            return;
          }
          resolve(!!row);
        }
      );
    });
  }

  updateArticleLikesCount(articleId: number): Promise<void> {
    return new Promise((resolve, reject) => {
      // Count actual likes from user_likes table and update article
      this.db.get(
        'SELECT COUNT(*) as likeCount FROM user_likes WHERE articleId = ?',
        [articleId],
        (err, row: any) => {
          if (err) {
            reject(err);
            return;
          }
          
          // Update the article's likes count
          this.db.run(
            'UPDATE articles SET likes = ? WHERE id = ?',
            [row.likeCount, articleId],
            (updateErr) => {
              if (updateErr) {
                reject(updateErr);
              } else {
                resolve();
              }
            }
          );
        }
      );
    });
  }

  /**
   * Update popularity score for a single article
   */
  async updatePopularityScore(articleId: number): Promise<void> {
    return new Promise((resolve, reject) => {
      // First, get article metrics
      this.db.get(
        'SELECT views, likes, purchases, publishDate FROM articles WHERE id = ?',
        [articleId],
        (err, row: any) => {
          if (err) {
            reject(err);
            return;
          }

          if (!row) {
            reject(new Error(`Article ${articleId} not found`));
            return;
          }

          // Calculate new score
          const score = calculatePopularityScore(
            row.views,
            row.likes,
            row.purchases,
            row.publishDate
          );

          // Update database
          this.db.run(
            'UPDATE articles SET popularityScore = ? WHERE id = ?',
            [score, articleId],
            (err) => {
              if (err) {
                reject(err);
              } else {
                console.log(`✅ Updated popularity score for article ${articleId}: ${score}`);
                resolve();
              }
            }
          );
        }
      );
    });
  }

  /**
   * Recalculate popularity scores for ALL articles
   */
  async recalculateAllPopularityScores(): Promise<{ updated: number; errors: number }> {
    return new Promise((resolve, reject) => {
      this.db.all('SELECT id, views, likes, purchases, publishDate FROM articles', [], async (err, rows: any[]) => {
        if (err) {
          reject(err);
          return;
        }

        let updated = 0;
        let errors = 0;

        console.log(`🔄 Recalculating popularity scores for ${rows.length} articles...`);

        for (const row of rows) {
          try {
            const score = calculatePopularityScore(
              row.views,
              row.likes,
              row.purchases,
              row.publishDate
            );

            await new Promise<void>((res, rej) => {
              this.db.run(
                'UPDATE articles SET popularityScore = ? WHERE id = ?',
                [score, row.id],
                (err) => {
                  if (err) {
                    rej(err);
                  } else {
                    res();
                  }
                }
              );
            });

            updated++;
          } catch (error) {
            console.error(`❌ Error updating article ${row.id}:`, error);
            errors++;
          }
        }

        console.log(`✅ Recalculation complete: ${updated} updated, ${errors} errors`);
        resolve({ updated, errors });
      });
    });
  }

  close(): void {
    this.db.close((err) => {
      if (err) {
        console.error('Error closing database:', err);
      } else {
        console.log('Database connection closed');
      }
    });
  }
}

export default Database;